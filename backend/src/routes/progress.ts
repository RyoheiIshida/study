import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { resolveViewTarget } from '../middleware/viewTarget.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { rollLuckyBonus } from '../lib/luckyBonus.js';
import { rewardRuleFor } from '../lib/difficulty.js';
import { SessionLength, computeSessionLength } from '../lib/sessionLength.js';
import { retiredQuizIds } from '../data/store.js';

const router = Router();
router.use(requireAuth);

router.get('/', resolveViewTarget, asyncHandler(async (req, res) => {
  const records = await prisma.progressRecord.findMany({
    where: { username: req.targetUsername! },
    orderBy: { lastPlayed: 'desc' },
  });
  res.json(records);
}));

async function sessionLengthFor(username: string, quizId: string, quizQuestionCount: number): Promise<SessionLength> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { username, quizId },
    orderBy: { playedAt: 'asc' },
    select: { total: true, correct: true },
  });
  return computeSessionLength(quizQuestionCount, attempts);
}

// 次のプレイで出す問題数を、クイズごとに返す。遊んだことのないクイズも最初の段階の問題数を返す。
router.get('/session-lengths', asyncHandler(async (req, res) => {
  const username = req.user!.username;
  const [quizzes, attempts] = await Promise.all([
    prisma.quiz.findMany({ select: { id: true, _count: { select: { questions: true } } } }),
    prisma.quizAttempt.findMany({
      where: { username },
      orderBy: { playedAt: 'asc' },
      select: { quizId: true, total: true, correct: true },
    }),
  ]);
  const result: Record<string, SessionLength> = {};
  for (const quiz of quizzes) {
    const quizAttempts = attempts.filter((attempt) => attempt.quizId === quiz.id);
    result[quiz.id] = computeSessionLength(quiz._count.questions, quizAttempts);
  }
  res.json(result);
}));

router.get('/session-lengths/:quizId', asyncHandler(async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.quizId },
    select: { _count: { select: { questions: true } } },
  });
  if (!quiz) {
    res.status(404).json({ message: 'Quiz not found' });
    return;
  }
  res.json(await sessionLengthFor(req.user!.username, req.params.quizId, quiz._count.questions));
}));

router.post('/', asyncHandler(async (req, res) => {
  const record = req.body as {
    quizId?: string;
    completed?: number;
    total?: number;
    correct?: number;
    streak?: number;
    durationMs?: number;
    lastPlayed?: string;
  };

  if (!record?.quizId || typeof record.correct !== 'number' || typeof record.total !== 'number') {
    res.status(400).json({ message: 'Invalid progress payload' });
    return;
  }

  // 正解数はポイント（おこづかい）と XP に直結するので、送られてきた値をそのまま信じずクイズの問題数と照らし合わせる。
  const quiz = await prisma.quiz.findUnique({
    where: { id: record.quizId },
    select: { grade: true, _count: { select: { questions: true } } },
  });
  // 一覧から外したクイズには、もう記録を足さない。
  if (!quiz || retiredQuizIds.has(record.quizId)) {
    res.status(400).json({ message: 'Invalid progress payload' });
    return;
  }
  // 上達して問題数が伸びたプレイは、同じ問題をくり返すのでクイズの問題数を超えることがある。
  // 超えてよいのは、履歴から数えたその人の今の問題数まで。
  const username = req.user!.username;
  const currentLength = await sessionLengthFor(username, record.quizId, quiz._count.questions);
  const maxTotal = Math.max(quiz._count.questions, currentLength.questionCount);
  const streak = record.streak ?? 0;
  const completed = record.completed ?? 0;
  const isCount = (value: number) => Number.isInteger(value) && value >= 0;
  if (
    ![record.total, record.correct, streak, completed].every(isCount) ||
    record.total < 1 ||
    record.total > maxTotal ||
    record.correct > record.total ||
    completed > record.total ||
    streak > record.correct
  ) {
    res.status(400).json({ message: 'Invalid progress payload' });
    return;
  }

  // Sessions saved by an older client, or before duration tracking existed,
  // carry no duration rather than a misleading zero.
  const durationMs =
    typeof record.durationMs === 'number' && Number.isFinite(record.durationMs) && record.durationMs >= 0
      ? Math.round(record.durationMs)
      : null;

  const payload = {
    username,
    quizId: record.quizId,
    completed,
    total: record.total,
    correct: record.correct,
    streak,
    // 交換できるポイントは「その月に獲得したぶん」なので、端末から送られた日時ではなくサーバーの時刻で記録する。
    lastPlayed: new Date(),
  };

  // 抽選はサーバーで行い、結果を記録に残す。クライアントから当たりを指定することはできない。
  const luckyBonus = rollLuckyBonus(payload.correct, rewardRuleFor(payload.quizId, quiz.grade).xpPerCorrect);

  const [saved] = await prisma.$transaction([
    prisma.progressRecord.upsert({
      where: {
        username_quizId: {
          username: payload.username,
          quizId: payload.quizId,
        },
      },
      update: payload,
      create: payload,
    }),
    prisma.quizAttempt.create({
      data: {
        username: payload.username,
        quizId: payload.quizId,
        total: payload.total,
        correct: payload.correct,
        streak: payload.streak,
        durationMs,
        luckyBonusXp: luckyBonus.bonusXp,
        playedAt: payload.lastPlayed,
      },
    }),
  ]);

  // 今回のプレイで次の段階へ進んだかを結果画面で伝えられるよう、保存後の問題数も返す。
  const sessionLength = await sessionLengthFor(username, payload.quizId, quiz._count.questions);

  res.status(201).json({ ...saved, luckyBonus, sessionLength });
}));

export default router;
