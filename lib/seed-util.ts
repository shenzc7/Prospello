import { PrismaClient, Role, CheckInStatus, ObjectiveStatus, GoalType, ProgressType } from '@prisma/client'
import { hash } from 'bcryptjs'
import { getFiscalQuarter } from './india'

const prisma = new PrismaClient()

export async function clearAndSeedDatabase() {
    console.log('--- Database Reset & Re-seed Started ---')

    // 1. Clear existing data in correct order
    await prisma.notification.deleteMany({})
    await prisma.comment.deleteMany({})
    await prisma.checkIn.deleteMany({})
    await prisma.initiative.deleteMany({})
    await prisma.keyResult.deleteMany({})
    await prisma.objective.deleteMany({})
    await prisma.teamMember.deleteMany({})
    await prisma.team.deleteMany({})
    await prisma.invitation.deleteMany({})
    await prisma.identityProviderConfig.deleteMany({})
    await prisma.account.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.organization.deleteMany({})

    console.log('Database cleared.')

    // 2. Create Organization
    const org = await prisma.organization.create({
        data: {
            name: 'GlobalTech International',
            slug: 'globaltech',
            settings: {
                fiscalYearStartMonth: 4,
                weekStart: 'monday',
                scoringScale: 'percent'
            }
        }
    })

    // 3. Define Roles & Users
    const passwordHash = await hash('Pass@123', 10)

    // Teams
    const teamNames = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'HR', 'Finance', 'Customer Success']
    const teams = await Promise.all(
        teamNames.map(name => prisma.team.create({ data: { name, orgId: org.id } }))
    )

    const engineeringTeam = teams.find(t => t.name === 'Engineering')!
    const productTeam = teams.find(t => t.name === 'Product')!
    const salesTeam = teams.find(t => t.name === 'Sales')!

    // Users (Total 100+)
    const users: any[] = []

    // Admins (5)
    for (let i = 1; i <= 5; i++) {
        const email = i === 1 ? 'admin@globaltech.dev' : `admin${i}@globaltech.dev`
        const user = await prisma.user.create({
            data: {
                email,
                name: `Admin User ${i}`,
                role: Role.ADMIN,
                passwordHash,
                orgId: org.id
            }
        })
        users.push(user)
    }

    // Managers (15)
    for (let i = 1; i <= 15; i++) {
        const email = i === 1 ? 'manager@globaltech.dev' : `manager${i}@globaltech.dev`
        const team = teams[i % teams.length]
        const user = await prisma.user.create({
            data: {
                email,
                name: `Manager User ${i}`,
                role: Role.MANAGER,
                passwordHash,
                orgId: org.id,
                teamMemberships: { create: { teamId: team.id, role: 'LEAD' } }
            }
        })
        users.push(user)
    }

    // Employees (80+)
    for (let i = 1; i <= 85; i++) {
        const email = i === 1 ? 'me@globaltech.dev' : `employee${i}@globaltech.dev`
        const team = teams[i % teams.length]
        const user = await prisma.user.create({
            data: {
                email,
                name: `Employee User ${i}`,
                role: Role.EMPLOYEE,
                passwordHash,
                orgId: org.id,
                teamMemberships: { create: { teamId: team.id, role: 'MEMBER' } }
            }
        })
        users.push(user)
    }

    console.log(`Created ${users.length} users across ${teams.length} teams.`)

    // 4. Create OKR Cycles
    const now = new Date()
    const currentYear = now.getFullYear()
    const q1label = `FY${currentYear - 2000}-${currentYear - 1999} Q1`
    const q2label = `FY${currentYear - 2000}-${currentYear - 1999} Q2`

    const q1Start = new Date(currentYear, 3, 1)
    const q1End = new Date(currentYear, 5, 30)

    // 5. Hierarchical OKRs

    // COMPANY LEVEL
    const companyObj = await prisma.objective.create({
        data: {
            title: 'Dominate Global Tech Market',
            description: 'Become the #1 provider of enterprise OKR solutions globally.',
            ownerId: users.find(u => u.role === 'ADMIN').id,
            cycle: q1label,
            startAt: q1Start,
            endAt: q1End,
            status: ObjectiveStatus.IN_PROGRESS,
            goalType: GoalType.COMPANY,
            priority: 1,
            weight: 100,
            fiscalQuarter: 1,
            keyResults: {
                create: [
                    { title: 'Achieve $50M ARR', weight: 40, target: 50, current: 32, unit: '$M' },
                    { title: 'Expand to 5 new markets', weight: 30, target: 5, current: 2, unit: 'markets' },
                    { title: 'Maintain 95% customer satisfaction', weight: 30, target: 95, current: 92, unit: '%' }
                ]
            }
        },
        include: { keyResults: true }
    })

    // TEAM LEVEL (Engineering)
    const engObj = await prisma.objective.create({
        data: {
            title: 'Scale Backend Infrastructure',
            description: 'Support 1M concurrent users with sub-100ms latency.',
            ownerId: users.find(u => u.role === 'MANAGER' && u.teamMemberships?.[0]?.teamId === engineeringTeam.id)?.id || users[5].id,
            teamId: engineeringTeam.id,
            parentId: companyObj.id,
            cycle: q1label,
            startAt: q1Start,
            endAt: q1End,
            status: ObjectiveStatus.AT_RISK,
            goalType: GoalType.TEAM,
            priority: 2,
            weight: 50,
            fiscalQuarter: 1,
            keyResults: {
                create: [
                    { title: 'Reduce API latency by 40%', weight: 50, target: 40, current: 15, unit: '%' },
                    { title: '99.99% system uptime', weight: 50, target: 99.99, current: 99.9, unit: '%' }
                ]
            }
        },
        include: { keyResults: true }
    })

    // INDIVIDUAL LEVEL (Linked to Engineering)
    const indObj = await prisma.objective.create({
        data: {
            title: 'Optimize Database Queries',
            description: 'Optimize top 10 most expensive queries in the system.',
            ownerId: users.find(u => u.role === 'EMPLOYEE' && u.teamMemberships?.[0]?.teamId === engineeringTeam.id)?.id || users[20].id,
            parentId: engObj.id,
            cycle: q1label,
            startAt: q1Start,
            endAt: q1End,
            status: ObjectiveStatus.IN_PROGRESS,
            goalType: GoalType.INDIVIDUAL,
            priority: 3,
            weight: 30,
            fiscalQuarter: 1,
            keyResults: {
                create: [
                    { title: 'Optimize 10 queries', weight: 100, target: 10, current: 4, unit: 'queries' }
                ]
            }
        },
        include: { keyResults: true }
    })

    // 6. Realistic History (Check-ins, Comments, Initiatives)
    const krs = [...companyObj.keyResults, ...engObj.keyResults, ...indObj.keyResults]

    for (const kr of krs) {
        // Check-ins for past 4 weeks
        for (let i = 1; i <= 4; i++) {
            const date = new Date()
            date.setDate(date.getDate() - (7 * i))
            await prisma.checkIn.create({
                data: {
                    keyResultId: kr.id,
                    userId: users[Math.floor(Math.random() * users.length)].id,
                    weekStart: date,
                    value: Math.min(100, Math.floor((kr.current / kr.target) * 100 * (1 - i * 0.1))),
                    status: i === 1 ? CheckInStatus.YELLOW : CheckInStatus.GREEN,
                    comment: `Weekly update ${i}: Making steady progress.`
                }
            })
        }

        // Comments
        await prisma.comment.create({
            data: {
                content: "Great progress on this KR! Keep it up.",
                userId: users[Math.floor(Math.random() * 5)].id, // Random admin
                keyResultId: kr.id
            }
        })

        // Initiatives
        await prisma.initiative.create({
            data: {
                keyResultId: kr.id,
                title: `Working on ${kr.title.toLowerCase()} related tasks`,
                status: 'DOING'
            }
        })
    }

    console.log('--- Database Reset & Re-seed Completed ---')
}
