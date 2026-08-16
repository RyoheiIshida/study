import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db.js';
import { computeAttemptXp, getLevelProgress } from '../lib/leveling.js';

const router = Router();
router.use(requireAuth);

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function jstDateKey(date: Date) {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return jst.toISOString().slice(0, 10);
}

router.get('/', async (req, res) => {
  const attempts = await prisma.quizAttempt.findMany({
    where: { username: req.user!.username },
    orderBy: { playedAt: 'asc' },
  });

  let cumulativeXp = 0;
  let previousLevel = 1;
  const levelUps: Array<{ level: number; at: string }> = [];
  const dailyMap = new Map<string, number>();

  for (const attempt of attempts) {
    const xp = computeAttemptXp(attempt);
    cumulativeXp += xp;

    const dateKey = jstDateKey(attempt.playedAt);
    dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + xp);

    const { level } = getLevelProgress(cumulativeXp);
    while (previousLevel < level) {
      previousLevel += 1;
      levelUps.push({ level: previousLevel, at: attempt.playedAt.toISOString() });
    }
  }

  let runningCumulative = 0;
  const dailyXp = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, xp]) => {
      runningCumulative += xp;
      return { date, xp, cumulativeXp: runningCumulative };
    });

  const progress = getLevelProgress(cumulativeXp);

  res.json({
    ...progress,
    attemptCount: attempts.length,
    dailyXp,
    levelUps,
  });
});

export default router;
