import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { Role } from '../generated/client.js';

declare global {
  namespace Express {
    interface Request {
      /** Whose study data a read endpoint should return. Set by `resolveViewTarget`. */
      targetUsername?: string;
    }
  }
}

/**
 * Lets a parent read a linked child's study data through the same endpoints
 * the child uses, by passing `?child=<username>`. Without the query the
 * signed-in user reads their own data, exactly as before.
 *
 * Only apply this to GET handlers: writes must always act on the signed-in
 * user, never on someone they are allowed to watch.
 */
export async function resolveViewTarget(req: Request, res: Response, next: NextFunction) {
  const child = typeof req.query.child === 'string' ? req.query.child.trim() : '';
  if (!child) {
    req.targetUsername = req.user!.username;
    return next();
  }

  if (req.user!.role !== Role.PARENT) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }

  try {
    const linked = await prisma.user.findFirst({
      where: { username: child, parent: { username: req.user!.username } },
      select: { username: true },
    });
    // An unlinked child and a nonexistent user look the same, so a parent
    // cannot probe which usernames exist.
    if (!linked) {
      return res.status(404).json({ message: 'Child not found.' });
    }
    req.targetUsername = linked.username;
    next();
  } catch (err) {
    next(err);
  }
}
