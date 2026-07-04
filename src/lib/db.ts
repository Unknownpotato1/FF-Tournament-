import { PrismaClient } from '@prisma/client'

// Bump this version to force a fresh PrismaClient when schema changes
const SCHEMA_VERSION = 'v3'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaSchemaVersion: string | undefined
}

// If schema version changed, discard old client
if (globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION) {
  if (globalForPrisma.prisma) {
    try { globalForPrisma.prisma.$disconnect() } catch {}
  }
  globalForPrisma.prisma = undefined
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db