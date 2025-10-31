import 'dotenv/config';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;

/**
 * Prevent multiple PrismaClient instances in development
 * (Hot reloading in SvelteKit can otherwise create duplicates)
 */
const globalForPrisma = globalThis;

export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		// log: ['query', 'error', 'warn'],
	});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
