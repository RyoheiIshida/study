import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const records = await prisma.progressRecord.findMany({
    where: { username: req.user!.username },
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
    lastPlayed?: string;
  };

  if (!record?.quizId || typeof record.correct !== 'number' || typeof record.total !== 'number') {
    res.status(400).json({ message: 'Invalid progress payload' });
    return;
  }

  const payload = {
    username: req.user!.username,
    quizId: record.quizId,
    completed: record.completed ?? 0,
    total: record.total,
    correct: record.correct,
    streak: record.streak ?? 0,
    lastPlayed: record.lastPlayed ? new Date(record.lastPlayed) : new Date(),
  };

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
        playedAt: payload.lastPlayed,
      },
    }),
  ]);

  res.status(201).json(saved);
}));

export default router;
