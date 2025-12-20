import { PrismaClient } from '@prisma/client'
import { clearAndSeedDatabase } from '../lib/seed-util'

const prisma = new PrismaClient()

async function main() {
  await clearAndSeedDatabase()

  console.log(`
Seed complete!
 - Organisation: GlobalTech International
 - Teams: Engineering, Product, Design, Sales, Marketing, HR, Finance, Customer Success
 - Users: 100+ created (admin@globaltech.dev, manager@globaltech.dev, me@globaltech.dev)
 - Password for all: Pass@123
`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
