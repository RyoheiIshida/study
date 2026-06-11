import { Router } from 'express';
import { getQuizById, getQuizzes, saveQuiz } from '../data/store.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(getQuizzes());
});

router.get('/:id', (req, res) => {
  const quiz = getQuizById(req.params.id);
  if (!quiz) {
    res.status(404).json({ message: 'Quiz not found' });
    return;
  }
  res.json(quiz);
});

router.post('/', (req, res) => {
  const quiz = req.body;
  if (!quiz?.id || !quiz.title || !quiz.questions) {
    res.status(400).json({ message: 'Invalid quiz payload' });
    return;
  }
  const created = saveQuiz(quiz);
  res.status(201).json(created);
});

export default router;
