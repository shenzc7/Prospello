import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning database for fresh start...')

  // Delete everything in order (respecting foreign keys)
  await prisma.notification.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.initiative.deleteMany()
  await prisma.checkIn.deleteMany()
  await prisma.keyResult.deleteMany()
  await prisma.objective.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  console.log('✅ Database cleared')

  // Create a fresh organization
  const org = await prisma.organization.create({
    data: {
      name: 'My Organization',
      slug: 'my-org',
    },
  })

  console.log(`✅ Created organization: ${org.name}`)

  // Create admin user
  const passwordHash = await hash('Admin@123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin',
      role: Role.ADMIN,
      orgId: org.id,
      passwordHash,
    },
  })

  console.log(`✅ Created admin user: ${admin.email}`)

  console.log(`
═══════════════════════════════════════════════════════════
  🎉 Fresh Start Complete!
═══════════════════════════════════════════════════════════
  
  Organization: ${org.name}
  
  Admin Login:
    Email:    admin@example.com
    Password: Admin@123
  
  You can now:
  1. Log in as admin
  2. Invite team members
  3. Create teams
  4. Start building your OKRs!
  
═══════════════════════════════════════════════════════════
`)
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })





