import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const records = await prisma.progressRecord.findMany({
    where: { username: req.user!.username },
    orderBy: { lastPlayed: 'desc' },
  });
  res.json(records);
});

router.post('/', async (req, res) => {
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

  const saved = await prisma.progressRecord.upsert({
    where: {
      username_quizId: {
        username: payload.username,
        quizId: payload.quizId,
      },
    },
    update: payload,
    create: payload,
  });

  res.status(201).json(saved);
});

export default router;
