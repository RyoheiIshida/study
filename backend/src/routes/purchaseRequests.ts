import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db.js';
import { Role, PurchaseRequestStatus } from '../generated/client.js';
import { computeAvailablePoints } from '../lib/points.js';
import { computeExchangeRate, computeRecentAccuracy } from '../lib/exchange.js';

const router = Router();
router.use(requireAuth);

router.get('/rate', requireRole(Role.CHILD), asyncHandler(async (req, res) => {
  const username = req.user!.username;
  const recentAccuracy = await computeRecentAccuracy(username);
  const rate = computeExchangeRate(recentAccuracy);
  const availablePoints = await computeAvailablePoints(username);
  res.json({ rate, recentAccuracy, availablePoints });
}));

router.post('/', requireRole(Role.CHILD), asyncHandler(async (req, res) => {
  const { pointsCost, memo } = req.body as { pointsCost?: number; memo?: string };
  if (!pointsCost || pointsCost <= 0 || !Number.isInteger(pointsCost)) {
    return res.status(400).json({ message: 'pointsCost must be a positive integer.' });
  }

  const child = await prisma.user.findUnique({ where: { username: req.user!.username } });
  if (!child?.parentId) {
    return res.status(400).json({ message: 'You must be linked to a parent account before requesting an exchange.' });
  }

  const availablePoints = await computeAvailablePoints(child.username);
  if (pointsCost > availablePoints) {
    return res.status(400).json({ message: 'You do not have enough available points for this request.' });
  }

  const recentAccuracy = await computeRecentAccuracy(child.username);
  const rate = computeExchangeRate(recentAccuracy);
  const cashAmount = Math.round(pointsCost * rate);

  const request = await prisma.purchaseRequest.create({
    data: {
      childId: child.id,
      parentId: child.parentId,
      pointsCost,
      rate,
      cashAmount,
      memo,
    },
  });

  res.status(201).json(request);
}));

router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query as { status?: string };
  const statusFilter = status ? { status: status as PurchaseRequestStatus } : {};

  const where = req.user!.role === Role.PARENT
    ? { parent: { username: req.user!.username }, ...statusFilter }
    : { child: { username: req.user!.username }, ...statusFilter };

  const requests = await prisma.purchaseRequest.findMany({
    where,
    include: {
      child: { select: { username: true } },
      parent: { select: { username: true } },
    },
    orderBy: { requestedAt: 'desc' },
  });

  res.json(requests);
}));

router.post('/:id/approve', requireRole(Role.PARENT), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const owned = await prisma.purchaseRequest.findFirst({
    where: { id, parent: { username: req.user!.username } },
  });
  if (!owned) {
    return res.status(404).json({ message: 'Purchase request not found.' });
  }
  if (owned.status !== PurchaseRequestStatus.REQUESTED) {
    return res.status(400).json({ message: 'This request has already been responded to.' });
  }

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: { status: PurchaseRequestStatus.APPROVED, respondedAt: new Date() },
  });
  res.json(updated);
}));

router.post('/:id/reject', requireRole(Role.PARENT), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body as { reason?: string };
  const owned = await prisma.purchaseRequest.findFirst({
    where: { id, parent: { username: req.user!.username } },
  });
  if (!owned) {
    return res.status(404).json({ message: 'Purchase request not found.' });
  }
  if (owned.status !== PurchaseRequestStatus.REQUESTED) {
    return res.status(400).json({ message: 'This request has already been responded to.' });
  }

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: { status: PurchaseRequestStatus.REJECTED, respondedAt: new Date(), rejectReason: reason },
  });
  res.json(updated);
}));

router.post('/:id/hand-over', requireRole(Role.PARENT), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const owned = await prisma.purchaseRequest.findFirst({
    where: { id, parent: { username: req.user!.username } },
  });
  if (!owned) {
    return res.status(404).json({ message: 'Purchase request not found.' });
  }
  if (owned.status !== PurchaseRequestStatus.APPROVED) {
    return res.status(400).json({ message: 'This request must be approved before it can be handed over.' });
  }

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: { status: PurchaseRequestStatus.HANDED_OVER, handedOverAt: new Date() },
  });
  res.json(updated);
}));

router.post('/:id/confirm-receipt', requireRole(Role.CHILD), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const owned = await prisma.purchaseRequest.findFirst({
    where: { id, child: { username: req.user!.username } },
  });
  if (!owned) {
    return res.status(404).json({ message: 'Purchase request not found.' });
  }
  if (owned.status !== PurchaseRequestStatus.HANDED_OVER) {
    return res.status(400).json({ message: 'This request has not been handed over yet.' });
  }

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: { status: PurchaseRequestStatus.RECEIVED, receivedAt: new Date() },
  });
  res.json(updated);
}));

router.post('/:id/cancel', requireRole(Role.CHILD), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const owned = await prisma.purchaseRequest.findFirst({
    where: { id, child: { username: req.user!.username } },
  });
  if (!owned) {
    return res.status(404).json({ message: 'Purchase request not found.' });
  }
  if (owned.status !== PurchaseRequestStatus.REQUESTED) {
    return res.status(400).json({ message: 'Only a pending request can be cancelled.' });
  }

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: { status: PurchaseRequestStatus.CANCELLED },
  });
  res.json(updated);
}));

export default router;
