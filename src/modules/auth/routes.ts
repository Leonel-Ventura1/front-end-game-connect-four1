import { Router, Request, Response } from 'express';
import { authService } from './service.js';
import { RegisterSchema, LoginSchema } from '../../middleware/validators.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const input = RegisterSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.errors) {
      console.error("REGISTER ERROR:", error);

      res.status(500).json({
        error: error?.message || error,
        stack: error?.stack
      });
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else if (error.status) {
      console.error("REGISTER ERROR:", error);

      res.status(500).json({
        error: error?.message || error,
        stack: error?.stack
      });
      res.status(error.status).json({ error: error.message });
    } else {
      console.error("REGISTER ERROR:", error);

      res.status(500).json({
        error: error?.message || error,
        stack: error?.stack
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const input = LoginSchema.parse(req.body);
    const result = await authService.login(input);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.errors) {
      console.error("REGISTER ERROR:", error);
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else if (error.status) {
      console.error("REGISTER ERROR:", error);


      res.status(error.status).json({ error: error.message });
    } else {
      console.error("REGISTER ERROR:", error);

      res.status(500).json({
        error: error?.message || error,
        stack: error?.stack
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await authService.getCurrentUser(req.user.userId);
    res.status(200).json(user);
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      error: error?.message || error,
      stack: error?.stack
    });
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
