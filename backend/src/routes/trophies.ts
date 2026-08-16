import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db.js';
import { computeTrophies } from '../lib/trophies.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const attempts = await prisma.quizAttempt.findMany({
    where: { username: req.user!.username },
    orderBy: { playedAt: 'asc' },
    include: { quiz: { select: { title: true, subject: true } } },
  });

  const trophies = computeTrophies(
    attempts.map((attempt) => ({
      quizId: attempt.quizId,
      total: attempt.total,
      correct: attempt.correct,
      playedAt: attempt.playedAt,
      quizTitle: attempt.quiz.title,
      subject: attempt.quiz.subject,
    })),
  );

  res.json({ trophies, count: trophies.length });
});

export default router;
