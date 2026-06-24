import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const seedUsers = [
  {
    id: generateId(),
    username: 'testuser',
    email: 'test@dreamstatic.app',
    passwordHash: hashPassword('password123'),
    displayName: 'Test User',
    bio: 'Exploring the digital dreamscape',
    joinedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: generateId(),
    username: 'cyber_angel',
    email: 'cyber@dreamstatic.app',
    passwordHash: hashPassword('y2k2024'),
    displayName: 'Cyber Angel',
    bio: 'Creating dreamscapes one pixel at a time | Y2K enthusiast',
    joinedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: generateId(),
    username: 'qa_tester',
    email: 'qa@dreamstatic.app',
    passwordHash: hashPassword('qa123456'),
    displayName: 'QA Tester',
    bio: 'Testing Dreamstatic features end-to-end',
    joinedAt: new Date('2026-06-01T00:00:00.000Z'),
  },
]

async function main() {
  const { PrismaClient } = await import('@prisma/client')
  const { PrismaNeon } = await import('@prisma/adapter-neon')
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required')
    process.exit(1)
  }
  const adapter = new PrismaNeon({ connectionString })
  const prisma = new PrismaClient({ adapter })
  await prisma.$connect()

  for (const user of seedUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } })
    if (!existing) {
      await prisma.user.create({ data: user })
      console.log(`Created user: ${user.username} (${user.email})`)
    } else {
      console.log(`User already exists: ${user.username} (${user.email})`)
    }
  }

  await prisma.$disconnect()
  console.log('Seed complete.')
}

main().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
