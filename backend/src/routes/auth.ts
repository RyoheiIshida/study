import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { signToken, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { Role } from '../generated/client.js';

const router = Router();

router.post('/register', asyncHandler(async (req, res) => {
  const { username, password, role } = req.body as { username?: string; password?: string; role?: string };
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  if (role !== undefined && role !== 'PARENT' && role !== 'CHILD') {
    return res.status(400).json({ message: 'Role must be PARENT or CHILD.' });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return res.status(400).json({ message: 'That username is already in use.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const resolvedRole: Role = role === 'PARENT' ? Role.PARENT : Role.CHILD;
  await prisma.user.create({ data: { username, passwordHash, role: resolvedRole } });
  const token = signToken({ username, role: resolvedRole });

  return res.status(201).json({ token, user: { username, role: resolvedRole } });
}));

router.post('/login', asyncHandler(async (req, res) => {
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

  const token = signToken({ username: user.username, role: user.role });
  return res.json({ token, user: { username: user.username, role: user.role } });
}));

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: { username: req.user!.username, role: req.user!.role } });
});

export default router;
