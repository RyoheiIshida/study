import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { resolveViewTarget } from '../middleware/viewTarget.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { computeTrophies } from '../lib/trophies.js';
import { computeSecretTrophies } from '../lib/secretTrophies.js';

const router = Router();
router.use(requireAuth);

router.get('/', resolveViewTarget, asyncHandler(async (req, res) => {
  const [attempts, loginRecords] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { username: req.targetUsername! },
      orderBy: { playedAt: 'asc' },
      include: { quiz: { select: { title: true, subject: true } } },
    }),
    prisma.loginRecord.findMany({
      where: { username: req.targetUsername! },
      orderBy: { date: 'asc' },
      select: { date: true },
    }),
  ]);

  const trophies = computeTrophies(
    attempts.map((attempt) => ({
      quizId: attempt.quizId,
      total: attempt.total,
      correct: attempt.correct,
      playedAt: attempt.playedAt,
      quizTitle: attempt.quiz.title,
      subject: attempt.quiz.subject,
    })),
  );

  const secrets = computeSecretTrophies({
    attempts: attempts.map((attempt) => ({
      quizId: attempt.quizId,
      subject: attempt.quiz.subject,
      total: attempt.total,
      correct: attempt.correct,
      durationMs: attempt.durationMs,
      playedAt: attempt.playedAt,
    })),
    loginDates: loginRecords.map((record) => record.date),
  });

  res.json({ trophies, count: trophies.length, secrets });
}));

export default router;
