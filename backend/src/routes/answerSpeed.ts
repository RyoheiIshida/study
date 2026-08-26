import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';

const router = Router();
router.use(requireAuth);

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function jstDateKey(date: Date) {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return jst.toISOString().slice(0, 10);
}

type IncomingRecord = {
  quizId?: string;
  questionId?: string;
  difficulty?: string;
  isCorrect?: boolean;
  elapsedMs?: number;
  answeredAt?: string;
};

router.post('/', asyncHandler(async (req, res) => {
  const body = req.body as { records?: IncomingRecord[] };
  const records = Array.isArray(body?.records) ? body.records : [];

  const valid = records.filter(
    (record): record is Required<IncomingRecord> =>
      typeof record.quizId === 'string' &&
      typeof record.questionId === 'string' &&
      typeof record.difficulty === 'string' &&
      typeof record.isCorrect === 'boolean' &&
      typeof record.elapsedMs === 'number' &&
      Number.isFinite(record.elapsedMs) &&
      record.elapsedMs >= 0,
  );

  if (valid.length === 0) {
    res.status(400).json({ message: 'No valid answer speed records were provided.' });
    return;
  }

  await prisma.answerRecord.createMany({
    data: valid.map((record) => ({
      username: req.user!.username,
      quizId: record.quizId,
      questionId: record.questionId,
      difficulty: record.difficulty,
      isCorrect: record.isCorrect,
      elapsedMs: Math.round(record.elapsedMs),
      answeredAt: record.answeredAt ? new Date(record.answeredAt) : new Date(),
    })),
  });

  res.status(201).json({ saved: valid.length });
}));

router.get('/', asyncHandler(async (req, res) => {
  const records = await prisma.answerRecord.findMany({
    where: { username: req.user!.username },
    orderBy: { answeredAt: 'asc' },
  });

  const grouped = new Map<string, { date: string; difficulty: string; totalMs: number; count: number }>();
  for (const record of records) {
    const date = jstDateKey(record.answeredAt);
    const key = `${date}__${record.difficulty}`;
    const entry = grouped.get(key) ?? { date, difficulty: record.difficulty, totalMs: 0, count: 0 };
    entry.totalMs += record.elapsedMs;
    entry.count += 1;
    grouped.set(key, entry);
  }

  const trend = Array.from(grouped.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      date: entry.date,
      difficulty: entry.difficulty,
      averageSeconds: Math.round((entry.totalMs / entry.count / 1000) * 10) / 10,
      count: entry.count,
    }));

  res.json(trend);
}));

export default router;
