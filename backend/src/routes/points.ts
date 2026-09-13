import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { resolveViewTarget } from '../middleware/viewTarget.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { DAILY_POINT_LIMIT, loadPointsLedger } from '../lib/points.js';
import { jstDateKey } from '../lib/loginDays.js';

const router = Router();
router.use(requireAuth);

router.get('/', resolveViewTarget, asyncHandler(async (req, res) => {
  const [ledger, correct] = await Promise.all([
    loadPointsLedger(req.targetUsername!),
    prisma.quizAttempt.aggregate({
      where: { username: req.targetUsername! },
      _sum: { correct: true },
      _count: true,
    }),
  ]);

  res.json({
    totalPoints: ledger.totalPoints,
    totalCorrect: correct._sum.correct ?? 0,
    totalAttempts: correct._count,
    todayPoints: ledger.pointsByDay.get(jstDateKey(new Date())) ?? 0,
    dailyPointLimit: DAILY_POINT_LIMIT,
  });
}));

export default router;
