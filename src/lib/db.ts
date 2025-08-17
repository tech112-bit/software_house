import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaClient: PrismaClient;

try {
  prismaClient = global.prisma || new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  if (process.env.NODE_ENV !== 'production') global.prisma = prismaClient;
} catch (error) {
  console.error('Failed to initialize Prisma Client:', error);
  throw error;
}

export const prisma = prismaClient;