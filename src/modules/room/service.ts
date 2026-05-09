import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RoomService {
  async listRooms(limit: number = 50, offset: number = 0) {
    const rooms = await prisma.room.findMany({
      where: { status: { in: ['waiting', 'playing'] } },
      include: {
        host: { select: { id: true, username: true, avatar: true } },
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return rooms.map(room => ({
      id: room.id,
      name: room.name,
      status: room.status,
      host: room.host,
      player1: room.player1,
      player2: room.player2,
      createdAt: room.createdAt,
    }));
  }

  async getRoomById(roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        host: { select: { id: true, username: true, avatar: true } },
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } },
        game: true,
        messages: {
          include: { user: { select: { id: true, username: true, avatar: true } } },
          take: 50,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!room) {
      throw {
        status: 404,
        message: 'Room not found',
      };
    }

if (room?.game) {
  room.game.board = JSON.parse(
    room.game.board as string
  );

  room.game.moves = JSON.parse(
    room.game.moves as string
  );

  room.game.winPositions =
    room.game.winPositions
      ? JSON.parse(room.game.winPositions)
      : null;
}

return room;
  }

  async createRoom(userId: string, name: string) {
    const room = await prisma.room.create({
      data: {
        name,
        hostId: userId,
        player1Id: userId,
        status: 'waiting',
      },
      include: {
        host: { select: { id: true, username: true, avatar: true } },
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } },
      },
    });

    return room;
  }

  async joinRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw {
        status: 404,
        message: 'Room not found',
      };
    }

    if (room.player2Id) {
      throw {
        status: 400,
        message: 'Room is full',
      };
    }

    if (room.player1Id === userId) {
      throw {
        status: 400,
        message: 'Already in room',
      };
    }

   
    const updated = await prisma.room.update({
      where: { id: roomId },
      data: { 
        player2Id: userId,
       },
      include: {
        host: { select: { id: true, username: true, avatar: true } },
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } },
        game: true,
      },
    });

    return updated;
  }

  async leaveRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw {
        status: 404,
        message: 'Room not found',
      };
    }

    if (room.hostId === userId) {
      await prisma.room.delete({
        where: { id: roomId },
      });
      return { deleted: true };
    }

  
    if (room.player2Id === userId) {
      await prisma.room.update({
        where: { id: roomId },
        data: { player2Id: null, status: 'waiting' },
      });
    }

    return { deleted: false };
  }

  async addMessage(roomId: string, userId: string, content: string) {
    const message = await prisma.message.create({
      data: {
        content,
        userId,
        roomId,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    return message;
  }

  async getRoomMessages(roomId: string, limit: number = 50) {
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages;
  }

  async updateRoomStatus(roomId: string, status: string) {
    const room = await prisma.room.update({
      where: { id: roomId },
      data: { status },
      include: {
        host: { select: { id: true, username: true, avatar: true } },
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } },
      },
    });

    return room;
  }
}

export const roomService = new RoomService();
