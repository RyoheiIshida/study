import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { buildLoginSummary, recordLoginDay } from '../lib/loginDays.js';

const router = Router();
router.use(requireAuth);

router.post('/checkin', asyncHandler(async (req, res) => {
  const username = req.user!.username;
  await recordLoginDay(username);
  res.status(201).json(await buildLoginSummary(username));
}));

router.get('/', asyncHandler(async (req, res) => {
  res.json(await buildLoginSummary(req.user!.username));
}));

export default router;
