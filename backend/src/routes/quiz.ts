import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const quizzes = await prisma.quiz.findMany({
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(quizzes);
});

router.get('/:id', async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!quiz) {
    res.status(404).json({ message: 'Quiz not found' });
    return;
  }

  res.json(quiz);
});

router.post('/', async (req, res) => {
  const quiz = req.body as {
    id?: string;
    title?: string;
    subject?: string;
    grade?: string;
    description?: string;
    questions?: Array<{
      id: string;
      text: string;
      answer: string;
      explanation?: string;
      order?: number;
    }>;
  };

  if (!quiz?.id || !quiz.title || !quiz.questions || !Array.isArray(quiz.questions)) {
    res.status(400).json({ message: 'Invalid quiz payload' });
    return;
  }

  const created = await prisma.quiz.create({
    data: {
      id: quiz.id,
      title: quiz.title,
      subject: quiz.subject ?? '',
      grade: quiz.grade ?? '',
      description: quiz.description ?? '',
      questions: {
        create: quiz.questions.map((question, index) => ({
          id: question.id,
          text: question.text,
          answer: question.answer,
          explanation: question.explanation ?? '',
          order: question.order ?? index,
        })),
      },
    },
    include: {
      questions: true,
    },
  });

  res.status(201).json(created);
});

export default router;
