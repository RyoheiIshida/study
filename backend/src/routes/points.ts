import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { resolveViewTarget } from '../middleware/viewTarget.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { computeEarnedPoints } from '../lib/points.js';
import { jstMonthRange } from '../lib/exchangeLimit.js';

const router = Router();
router.use(requireAuth);

router.get('/', resolveViewTarget, asyncHandler(async (req, res) => {
  const username = req.targetUsername!;
  const { start, end } = jstMonthRange(new Date());
  const [totalPoints, monthlyEarnedPoints, correct] = await Promise.all([
    computeEarnedPoints(username),
    computeEarnedPoints(username, { start, end }),
    prisma.quizAttempt.aggregate({
      where: { username },
      _sum: { correct: true },
      _count: true,
    }),
  ]);

  res.json({
    totalPoints,
    totalCorrect: correct._sum.correct ?? 0,
    totalAttempts: correct._count,
    monthlyEarnedPoints,
  });
}));

export default router;
