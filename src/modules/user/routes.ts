import { Router, Request, Response } from 'express';
import { userService } from './service.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();

router.get('/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserProfile(userId);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/:userId/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const stats = await userService.getUserStats(userId);
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/:userId/games', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const games = await userService.getUserGames(userId, limit, offset);
    res.status(200).json(games);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.put('/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.userId !== req.params.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const user = await userService.updateUserProfile(req.params.userId, req.body);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
