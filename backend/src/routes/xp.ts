import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { computeAttemptXp, getLevelProgress } from '../lib/leveling.js';

const router = Router();
router.use(requireAuth);

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function jstDateKey(date: Date) {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return jst.toISOString().slice(0, 10);
}

router.get('/', asyncHandler(async (req, res) => {
  const attempts = await prisma.quizAttempt.findMany({
    where: { username: req.user!.username },
    orderBy: { playedAt: 'asc' },
  });

  let cumulativeXp = 0;
  let previousLevel = 1;
  const levelUps: Array<{ level: number; at: string }> = [];
  const dailyMap = new Map<string, { xp: number; questions: number; attempts: number }>();

  for (const attempt of attempts) {
    const xp = computeAttemptXp(attempt);
    cumulativeXp += xp;

    const dateKey = jstDateKey(attempt.playedAt);
    const entry = dailyMap.get(dateKey) ?? { xp: 0, questions: 0, attempts: 0 };
    entry.xp += xp;
    entry.questions += attempt.total;
    entry.attempts += 1;
    dailyMap.set(dateKey, entry);

    const { level } = getLevelProgress(cumulativeXp);
    while (previousLevel < level) {
      previousLevel += 1;
      levelUps.push({ level: previousLevel, at: attempt.playedAt.toISOString() });
    }
  }

  let runningCumulative = 0;
  const dailyXp = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entry]) => {
      runningCumulative += entry.xp;
      return {
        date,
        xp: entry.xp,
        cumulativeXp: runningCumulative,
        questions: entry.questions,
        attempts: entry.attempts,
      };
    });

  const progress = getLevelProgress(cumulativeXp);

  res.json({
    ...progress,
    attemptCount: attempts.length,
    studyDays: dailyMap.size,
    dailyXp,
    levelUps,
  });
}));

export default router;
