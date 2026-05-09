import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

async function seed() {

  


  const user1 = await prisma.user.create({
    data: {
      email: 'player1@example.com',
      username: 'player1',
      passwordHash: await hashPassword('password123'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player1',
      stats: {
        create: {
          wins: 5,
          losses: 2,
          draws: 1,
          totalGames: 8,
        },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'player2@example.com',
      username: 'player2',
      passwordHash: await hashPassword('password123'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player2',
      stats: {
        create: {
          wins: 3,
          losses: 4,
          draws: 1,
          totalGames: 8,
        },
      },
    },
  });

  // Create sample room
  const room = await prisma.room.create({
    data: {
      name: 'Friendly Match',
      hostId: user1.id,
      player1Id: user1.id,
      player2Id: user2.id,
      status: 'waiting',
    },
  });

  console.log('✅ Seed completed!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
