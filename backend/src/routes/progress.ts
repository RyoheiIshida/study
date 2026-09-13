import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { resolveViewTarget } from '../middleware/viewTarget.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { rollLuckyBonus } from '../lib/luckyBonus.js';
import { rewardRuleFor } from '../lib/difficulty.js';

const router = Router();
router.use(requireAuth);

router.get('/', resolveViewTarget, asyncHandler(async (req, res) => {
  const records = await prisma.progressRecord.findMany({
    where: { username: req.targetUsername! },
    orderBy: { lastPlayed: 'desc' },
  });
  res.json(records);
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
  const streak = record.streak ?? 0;
  const completed = record.completed ?? 0;
  const isCount = (value: number) => Number.isInteger(value) && value >= 0;
  if (
    !quiz ||
    ![record.total, record.correct, streak, completed].every(isCount) ||
    record.total < 1 ||
    record.total > quiz._count.questions ||
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
    username: req.user!.username,
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

  res.status(201).json({ ...saved, luckyBonus });
}));

export default router;
