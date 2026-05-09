import { PrismaClient } from '@prisma/client';
import { UserWithStats } from '../../types/index.js';

const prisma = new PrismaClient();

export class UserService {
  async getUserProfile(userId: string): Promise<UserWithStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stats: true },
    });

    if (!user) {
      throw {
        status: 404,
        message: 'User not found',
      };
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
      stats: {
        wins: user.stats?.wins || 0,
        losses: user.stats?.losses || 0,
        draws: user.stats?.draws || 0,
        totalGames: user.stats?.totalGames || 0,
      },
    };
  }

  async getUserStats(userId: string) {
    const stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      return {
        wins: 0,
        losses: 0,
        draws: 0,
        totalGames: 0,
      };
    }

    return {
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      totalGames: stats.totalGames,
    };
  }

  async getUserGames(userId: string, limit: number = 20, offset: number = 0) {
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
      },
      include: {
        player1: true,
        player2: true,
        winner: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return games.map(game => ({
      id: game.id,
      player1: {
        id: game.player1.id,
        username: game.player1.username,
        avatar: game.player1.avatar,
      },
      player2: game.player2 ? {
        id: game.player2.id,
        username: game.player2.username,
        avatar: game.player2.avatar,
      } : null,
      winner: game.winner ? {
        id: game.winner.id,
        username: game.winner.username,
      } : null,
      status: game.status,
      createdAt: game.createdAt,
    }));
  }

  async updateUserProfile(userId: string, data: { username?: string; avatar?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }
}

export const userService = new UserService();
