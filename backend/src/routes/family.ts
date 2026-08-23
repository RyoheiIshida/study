import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { Role } from '../generated/client.js';

const router = Router();
router.use(requireAuth);

const INVITE_EXPIRY_MS = 24 * 60 * 60 * 1000;

function generateInviteCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

router.post('/invite', requireRole(Role.PARENT), asyncHandler(async (req, res) => {
  const parent = await prisma.user.findUnique({ where: { username: req.user!.username } });
  if (!parent) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const code = generateInviteCode();
  const invite = await prisma.familyInvite.create({
    data: {
      code,
      parentId: parent.id,
      expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
    },
  });

  return res.status(201).json({ code: invite.code, expiresAt: invite.expiresAt });
}));

router.post('/link', requireRole(Role.CHILD), asyncHandler(async (req, res) => {
  const { code } = req.body as { code?: string };
  if (!code) {
    return res.status(400).json({ message: 'Invite code is required.' });
  }

  const invite = await prisma.familyInvite.findUnique({ where: { code } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return res.status(400).json({ message: 'That invite code is invalid or has expired.' });
  }

  const child = await prisma.user.findUnique({ where: { username: req.user!.username } });
  if (!child) {
    return res.status(404).json({ message: 'User not found.' });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: child.id }, data: { parentId: invite.parentId } }),
    prisma.familyInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
  ]);

  return res.status(200).json({ linked: true });
}));

router.get('/me', asyncHandler(async (req, res) => {
  if (req.user!.role === Role.PARENT) {
    const children = await prisma.user.findMany({
      where: { parent: { username: req.user!.username } },
      select: { username: true },
    });
    return res.json({ role: Role.PARENT, children });
  }

  const child = await prisma.user.findUnique({
    where: { username: req.user!.username },
    include: { parent: { select: { username: true } } },
  });
  return res.json({ role: Role.CHILD, parent: child?.parent ?? null });
}));

export default router;
