import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { rewardRuleFor } from '../lib/difficulty.js';
import { retiredQuizIds } from '../data/store.js';

const router = Router();

// 難易度ごとの1問あたりの報酬を添えて返す。画面で「難しいほど多くもらえる」ことを見せるため。
function withReward<T extends { id: string; grade: string }>(quiz: T) {
  return { ...quiz, reward: rewardRuleFor(quiz.id, quiz.grade) };
}

router.get('/', asyncHandler(async (req, res) => {
  const quizzes = await prisma.quiz.findMany({
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(quizzes.filter((quiz) => !retiredQuizIds.has(quiz.id)).map(withReward));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!quiz || retiredQuizIds.has(quiz.id)) {
    res.status(404).json({ message: 'Quiz not found' });
    return;
  }

  res.json(withReward(quiz));
}));

router.post('/', asyncHandler(async (req, res) => {
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
      options?: string[];
      graphOptions?: Array<{ id: string; slope: number; intercept: number }>;
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
          options: question.options ?? [],
          graphOptions: question.graphOptions ?? [],
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
}));

export default router;
