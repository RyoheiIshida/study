import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { generateDailyQuests, QuestStats } from '../data/quests.js';
import { computeAttemptXp, getLevelProgress } from '../lib/leveling.js';

const router = Router();
router.use(requireAuth);

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getJstDayRangeUtc(now = new Date()) {
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  const jstMidnightAsUtc = Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate());
  const startUtc = new Date(jstMidnightAsUtc - JST_OFFSET_MS);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc };
}

function jstDateKey(date: Date) {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return jst.toISOString().slice(0, 10);
}

router.get('/today', asyncHandler(async (req, res) => {
  const { startUtc, endUtc } = getJstDayRangeUtc();
  const username = req.user!.username;

  const [todayAttempts, allAttempts] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { username, playedAt: { gte: startUtc, lt: endUtc } },
    }),
    prisma.quizAttempt.findMany({ where: { username } }),
  ]);

  const stats: QuestStats = {
    attemptCount: todayAttempts.length,
    totalCorrect: todayAttempts.reduce((sum, attempt) => sum + attempt.correct, 0),
    bestStreak: todayAttempts.reduce((max, attempt) => Math.max(max, attempt.streak), 0),
  };

  const totalXp = allAttempts.reduce((sum, attempt) => sum + computeAttemptXp(attempt), 0);
  const { level } = getLevelProgress(totalXp);
  const seed = `${username}:${jstDateKey(new Date())}`;

  const quests = generateDailyQuests(level, seed).map((def) => ({
    id: def.id,
    title: def.title,
    description: def.description,
    target: def.target,
    current: Math.min(def.current(stats), def.target),
    completed: def.completed(stats),
  }));

  res.json(quests);
}));

export default router;
