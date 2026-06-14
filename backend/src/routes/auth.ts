import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { signToken, requireAuth } from '../middleware/auth.js';
import { prisma } from '../db.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return res.status(400).json({ message: 'That username is already in use.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { username, passwordHash } });
  const token = signToken({ username });

  return res.status(201).json({ token, user: { username } });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).json({ message: 'Username or password is incorrect.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Username or password is incorrect.' });
  }

  const token = signToken({ username });
  return res.json({ token, user: { username } });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: { username: req.user!.username } });
});

export default router;
