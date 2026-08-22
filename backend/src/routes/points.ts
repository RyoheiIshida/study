import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db.js';
import { computeAttemptPoints } from '../lib/points.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const attempts = await prisma.quizAttempt.findMany({
    where: { username: req.user!.username },
  });

  let totalPoints = 0;
  let totalCorrect = 0;
  for (const attempt of attempts) {
    totalPoints += computeAttemptPoints(attempt);
    totalCorrect += attempt.correct;
  }

  res.json({
    totalPoints,
    totalCorrect,
    totalAttempts: attempts.length,
  });
});

export default router;
