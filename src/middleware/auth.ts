import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/auth.js';
import { JwtPayload } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

if (err.status) {
  res.status(err.status).json({ error: err.message });
} else {
  console.error(err);

console.error("REGISTER ERROR:", err);

res.status(500).json({
  error: err?.message || err,
  stack: err?.stack
});
}
};
