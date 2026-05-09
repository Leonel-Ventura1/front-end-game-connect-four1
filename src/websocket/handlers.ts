import { Server, Socket } from 'socket.io';
import { roomService } from '../modules/room/service.js';
import { gameService } from '../modules/game/service.js';
import { verifyToken } from '../utils/auth.js';

interface SocketUser {
  userId: string;
  username: string;
  avatar: string;
}

export const setupSocketHandlers = (io: Server) => {

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('No token provided'));
    }

    const payload = verifyToken(token);

    if (!payload) {
      return next(new Error('Invalid token'));
    }

    socket.data = {
      userId: payload.userId,
      username: payload.email.split('@')[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.userId}`,
    } as SocketUser;

    next();
  });


  io.on('connection', (socket: Socket) => {
    console.log('connected:', socket.id);

    const getUser = (): SocketUser => {
      return socket.data as SocketUser;
    };

 
    socket.on('room:join', async (roomId: string, cb) => {
      try {
        const user = getUser();

        socket.join(`room:${roomId}`);

        const room = await roomService.getRoomById(roomId);

        io.to(`room:${roomId}`).emit('room:user-joined', user);

        cb({ ok: true, room });
      } catch (err: any) {
        cb({ error: err.message });
      }
    });

 
    socket.on('room:leave', (roomId: string) => {
      try {
        const user = getUser();

        socket.leave(`room:${roomId}`);

        io.to(`room:${roomId}`).emit('room:user-left', user);
      } catch (err) {
    
      }
    });

    socket.on(
      'game:start',
      async (data: { roomId: string }, cb) => {
        try {
          const user = getUser();

     
          const result = await gameService.startGame(data.roomId, user.userId);

 
          io.to(`room:${data.roomId}`).emit('game:started', {
            game: result.game,
            room: result.room,
            startedBy: user.userId,
            startedAt: new Date(),
          });

          cb({ ok: true, game: result.game });
        } catch (err: any) {
          cb({ error: err.message });
        }
      }
    );

    socket.on(
      'game:move',
      async (data: { gameId: string; column: number }, cb) => {
        try {
          const user = getUser();

          const game = await gameService.makeMove(
            data.gameId,
            data.column,
            user.userId
          );

          const fullGame = await gameService.getGameById(data.gameId);

       
          io.to(`room:${game.roomId}`).emit(
            'game:updated',
            fullGame
          );

          cb({ ok: true, game: fullGame });
        } catch (err: any) {
          cb({ error: err.message });
        }
      }
    );

    socket.on('game:reset', async (gameId: string, cb) => {
      try {
        const game = await gameService.resetGame(gameId);

        const fullGame = await gameService.getGameById(gameId);

        io.to(`room:${game.roomId}`).emit(
          'game:updated',
          fullGame
        );

        cb({ ok: true, game: fullGame });
      } catch (err: any) {
        cb({ error: err.message });
      }
    });


    socket.on(
      'chat:message',
      async (data: { roomId: string; content: string }, cb) => {
        try {
          const user = getUser();

          if (!data?.content?.trim()) {
            return cb({ error: 'Empty message' });
          }

          const message = await roomService.addMessage(
            data.roomId,
            user.userId,
            data.content
          );

          io.to(`room:${data.roomId}`).emit('chat:new-message', {
            id: message.id,
            content: message.content,
            userId: user.userId,
            username: user.username,
            avatar: user.avatar,
            createdAt: message.createdAt,
          });

          cb({ ok: true });
        } catch (err: any) {
          cb({ error: err.message });
        }
      }
    );


    socket.on('chat:typing', (data: { roomId: string; typing: boolean }) => {
      try {
        const user = getUser();

        io.to(`room:${data.roomId}`).emit('chat:user-typing', {
          userId: user.userId,
          username: user.username,
          typing: data.typing,
        });
      } catch {
   
      }
    });

    socket.on('disconnect', () => {
      console.log('disconnected:', socket.id);
    });
  });
};