import { Router } from 'express';
import { getProgress, saveProgressRecord } from '../data/store.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(getProgress());
});

router.post('/', (req, res) => {
  const record = req.body;
  if (!record?.quizId || typeof record.correct !== 'number' || typeof record.total !== 'number') {
    res.status(400).json({ message: 'Invalid progress payload' });
    return;
  }
  const saved = saveProgressRecord(record);
  res.status(201).json(saved);
});

export default router;
