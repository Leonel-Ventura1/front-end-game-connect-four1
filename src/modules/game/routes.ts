import { Router, Request, Response } from 'express';
import { gameService } from './service.js';
import { authMiddleware } from '../../middleware/auth.js';
import { MakeMoveSchema } from '../../middleware/validators.js';

const router = Router();

router.get('/:gameId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const game = await gameService.getGameById(req.params.gameId);
    res.status(200).json(game);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post('/:roomId/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await gameService.startGame(req.params.roomId, req.user.userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post('/:gameId/move', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const input = MakeMoveSchema.parse(req.body);
    const game = await gameService.makeMove(req.params.gameId, input.column, req.user.userId);
    res.status(200).json(game);
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
});

router.post('/:gameId/reset', authMiddleware, async (req: Request, res: Response) => {
  try {
    const game = await gameService.resetGame(req.params.gameId);
    res.status(200).json(game);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
