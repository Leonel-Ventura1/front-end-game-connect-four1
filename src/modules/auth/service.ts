import { PrismaClient } from '@prisma/client';
import { createToken, hashPassword, comparePassword, generateAvatar } from '../../utils/auth.js';
import { RegisterInput, LoginInput } from '../../middleware/validators.js';
import { User as UserType } from '../../types/index.js';

const prisma = new PrismaClient();

export class AuthService {
  async register(input: RegisterInput): Promise<{ token: string; user: UserType }> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      throw {
        status: 409,
        message: 'User already exists',
      };
    }

    const passwordHash = await hashPassword(input.password);
    const avatar = generateAvatar(input.username);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        avatar,
        stats: {
          create: {},
        },
      },
    });

    const token = createToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    };
  }

  async login(input: LoginInput): Promise<{ token: string; user: UserType }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw {
        status: 401,
        message: 'Invalid credentials',
      };
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw {
        status: 401,
        message: 'Invalid credentials',
      };
    }

    const token = createToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    };
  }

  async getCurrentUser(userId: string): Promise<UserType> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    };
  }
}

export const authService = new AuthService();
