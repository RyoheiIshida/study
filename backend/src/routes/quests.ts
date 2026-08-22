import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { dailyQuestDefinitions, QuestStats } from '../data/quests.js';

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

router.get('/today', asyncHandler(async (req, res) => {
  const { startUtc, endUtc } = getJstDayRangeUtc();

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      username: req.user!.username,
      playedAt: { gte: startUtc, lt: endUtc },
    },
  });

  const stats: QuestStats = {
    attemptCount: attempts.length,
    totalCorrect: attempts.reduce((sum, attempt) => sum + attempt.correct, 0),
    bestStreak: attempts.reduce((max, attempt) => Math.max(max, attempt.streak), 0),
  };

  const quests = dailyQuestDefinitions.map((def) => ({
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
