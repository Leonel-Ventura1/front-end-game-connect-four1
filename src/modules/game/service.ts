import { PrismaClient } from '@prisma/client';
import { GameEngine } from '../../utils/game.js';

const prisma = new PrismaClient();

export class GameService {
  async getGameById(gameId: string) {
 const game = await prisma.game.findUnique({
  where: { id: gameId },
  select: {
    id: true,
    player1Id: true,
    player2Id: true,
    currentPlayer: true,
    status: true,
    board: true,
    moves: true,
    winnerId: true,
    winType: true,
    winPositions: true,
    player1: true,
    player2: true,
  },
});

    if (!game) {
      throw {
        status: 404,
        message: 'Game not found',
      };
    }


   const moves =
  typeof game.moves === 'string'
    ? JSON.parse(game.moves)
    : game.moves;
    const currentPlayer = moves.length % 2 === 0 ? 'player1' : 'player2';

    return {
      ...game,
      board: game.board ? JSON.parse(game.board) : null,
      moves: moves,
      winPositions: game.winPositions ? JSON.parse(game.winPositions) : undefined,
      currentPlayer,
    };
  }

  async createGame(player1Id: string, player2Id?: string) {
    const game = await prisma.game.create({
      data: {
        player1Id,
        player2Id,
        status: 'playing',
        moves: JSON.stringify([]),
        board: JSON.stringify(Array(6).fill(null).map(() => Array(7).fill(null))),
      },
      include: {
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } },
      },
    });

    return game;
  }

  async makeMove(gameId: string, column: number, playerId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        player1: true,
        player2: true,
      },
    });

    if (!game) {
      throw {
        status: 404,
        message: 'Game not found',
      };
    }

      if (game.status !== 'playing') {
      throw {
        status: 400,
        message: `Game is not active (status: ${game.status})`,
      };
    }

  if (playerId !== game.player1Id && playerId !== game.player2Id) {
      throw {
        status: 403,
        message: 'You are not a player in this game',
      };
    }

const board =
  typeof game.board === 'string'
    ? JSON.parse(game.board)
    : game.board;

const moves =
  typeof game.moves === 'string'
    ? JSON.parse(game.moves)
    : game.moves;

  const engine = new GameEngine(
  game.player1Id,
  game.player2Id || game.player1Id,
  board || undefined,
  moves || []
);

    const result = engine.makeMove(column, playerId);

    if (!result.success) {
      throw {
        status: 400,
        message: result.error,
      };
    }

    const state = engine.getState();

    const updated = await prisma.game.update({
      where: { id: gameId },
     data: {
  board: JSON.stringify(state.board),

  moves: JSON.stringify(state.moves),

  currentPlayer: state.currentPlayer,

  status: state.status,

  winnerId: state.winner,

  winType: state.winType,

  winPositions: state.winPositions
    ? JSON.stringify(state.winPositions)
    : null,
},
      include: {
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } },
        winner: { select: { id: true, username: true } },
      },
    });

    if (updated.status === 'completed' && updated.winnerId) {
      await prisma.userStats.updateMany({
        where: {
          userId: {
            in: [game.player1Id, game.player2Id || game.player1Id],
          },
        },
        data: { totalGames: { increment: 1 } },
      });

      await prisma.userStats.update({
        where: { userId: updated.winnerId },
        data: { wins: { increment: 1 } },
      });

      const loser = game.player1Id === updated.winnerId ? game.player2Id : game.player1Id;
      if (loser) {
        await prisma.userStats.update({
          where: { userId: loser },
          data: { losses: { increment: 1 } },
        });
      }
    } else if (updated.status === 'draw') {
      await prisma.userStats.updateMany({
        where: {
          userId: {
            in: [game.player1Id, game.player2Id || game.player1Id],
          },
        },
        data: {
          draws: { increment: 1 },
          totalGames: { increment: 1 },
        },
      });
    }

    return {
      ...updated,
      board: updated.board ? JSON.parse(updated.board) : null,
      moves: JSON.parse(updated.moves),
      winPositions: updated.winPositions ? JSON.parse(updated.winPositions) : undefined,
      currentPlayer: JSON.parse(updated.moves).length % 2 === 0 ? 'player1' : 'player2',
    };
  }

  async resetGame(gameId: string) {
    const updated = await prisma.game.update({
      where: { id: gameId },
      data: {
        board: JSON.stringify(Array(6).fill(null).map(() => Array(7).fill(null))),
        moves: JSON.stringify([]),
        status: 'playing',
        winnerId: null,
        winType: null,
        winPositions: null,
      },
      include: {
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } },
      },
    });

    return {
      ...updated,
      board: JSON.parse(updated.board),
      moves: JSON.parse(updated.moves),
      winPositions: null,
      currentPlayer: 'player1',
    };
  }


  async startGame(roomId: string, userId: string) {

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw {
        status: 404,
        message: 'Room not found',
      };
    }

    if (room.hostId !== userId) {
      throw {
        status: 403,
        message: 'Only host can start the game',
      };
    }

 
    if (!room.player1Id || !room.player2Id) {
      throw {
        status: 400,
        message: 'Game requires exactly 2 players',
      };
    }

    let game = await prisma.game.findFirst({
      where: { roomId },
    });

    if (game) {
   
      if (game.status === 'completed' || game.status === 'draw') {
        game = await prisma.game.update({
          where: { id: game.id },
          data: {
            status: 'playing',
            board: JSON.stringify(Array(6).fill(null).map(() => Array(7).fill(null))),
            moves: JSON.stringify([]),
            winnerId: null,
            winType: null,
            winPositions: null,
            currentPlayer: 'player1',
          },
          include: {
            player1: { select: { id: true, username: true, avatar: true } },
            player2: { select: { id: true, username: true, avatar: true } },
          },
        });
      }
    } else {
       game = await prisma.game.create({
        data: {
          roomId,
          player1Id: room.player1Id,
          player2Id: room.player2Id,
          status: 'playing',
          board: JSON.stringify(Array(6).fill(null).map(() => Array(7).fill(null))),
          moves: JSON.stringify([]),
          currentPlayer: 'player1',
        },
        include: {
          player1: { select: { id: true, username: true, avatar: true } },
          player2: { select: { id: true, username: true, avatar: true } },
        },
      });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { status: 'playing' },
      include: {
        host: { select: { id: true, username: true, avatar: true } },
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } },
      },
    });

    return {
      room: updatedRoom,
      game: {
        ...game,
        board: JSON.parse(game.board),
        moves: JSON.parse(game.moves),
        winPositions: game.winPositions ? JSON.parse(game.winPositions) : null,
      },
    };
  }
}

export const gameService = new GameService();
