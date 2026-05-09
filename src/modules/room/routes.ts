import { Router, Request, Response } from 'express';
import { roomService } from './service.js';
import { authMiddleware } from '../../middleware/auth.js';
import { CreateRoomSchema, SendMessageSchema } from '../../middleware/validators.js';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const rooms = await roomService.listRooms(limit, offset);
    res.status(200).json(rooms);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/:roomId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const room = await roomService.getRoomById(req.params.roomId);
    res.status(200).json(room);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const input = CreateRoomSchema.parse(req.body);
    const room = await roomService.createRoom(req.user.userId, input.name);
    res.status(201).json(room);
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
});

router.post('/:roomId/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const room = await roomService.joinRoom(req.params.roomId, req.user.userId);
    res.status(200).json(room);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post('/:roomId/leave', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await roomService.leaveRoom(req.params.roomId, req.user.userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/:roomId/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await roomService.getRoomMessages(req.params.roomId, limit);
    res.status(200).json(messages);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post('/:roomId/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const input = SendMessageSchema.parse(req.body);
    const message = await roomService.addMessage(
      req.params.roomId,
      req.user.userId,
      input.content
    );
    res.status(201).json(message);
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
});

export default router;
