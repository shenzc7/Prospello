import { PrismaClient, Role, CheckInStatus, ObjectiveStatus, GoalType } from '@prisma/client'
import { hash } from 'bcryptjs'
import { getFiscalQuarter } from './india'

const prisma = new PrismaClient()

// --- Utility Data ---

const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Shirley', 'Eric', 'Angela', 'Jonathan', 'Helen', 'Stephen', 'Anna', 'Larry', 'Brenda', 'Justin', 'Pamela', 'Scott', 'Nicole', 'Brandon', 'Emma', 'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Gregory', 'Christine', 'Alexander', 'Debra', 'Frank', 'Rachel', 'Patrick', 'Catherine', 'Raymond', 'Carolyn', 'Jack', 'Janet', 'Dennis', 'Ruth', 'Jerry', 'Maria']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts']

const COMMENT_TEMPLATES = [
    "This is a critical milestone for the team. Let's stay focused.",
    "Great update! I see some risks with the timeline though, can we discuss?",
    "I've shared some additional context in the Slack channel.",
    "Excellent progress on this KR. Who is the primary point of contact for the next phase?",
    "The data looks solid. Let's ensure the documentation is updated as well.",
    "I'm a bit concerned about the dependency on the DevOps team here.",
    "Keep up the momentum guys, we are almost at the target!",
    "Can we automate this tracking? Manual updates are becoming tedious.",
    "Alignment looks great. I'll sync with the Product team on this.",
    "How does this impact our Q4 goals?"
]

const INITIATIVE_TITLES = [
    "Draft initial strategy document",
    "Conduct stakeholder interviews",
    "Develop POC for service layer",
    "Perform market analysis benchmarks",
    "Review security protocols",
    "Optimize frontend performance",
    "Finalize vendor contracts",
    "Training sessions for new hires",
    "Refactor legacy database schema",
    "Beta testing with early adopters"
]

// --- Helper Functions ---

function getRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateFullName() {
    return `${getRandom(FIRST_NAMES)} ${getRandom(LAST_NAMES)}`
}

const usedEmails = new Set<string>()
function generateEmail(name: string) {
    let base = name.toLowerCase().replace(/\s/g, '.')
    let email = `${base}@globaltech.dev`
    let counter = 1
    while (usedEmails.has(email)) {
        email = `${base}.${counter}@globaltech.dev`
        counter++
    }
    usedEmails.add(email)
    return email
}

async function addActivityForOKR(okr: any, krs: any[], isPast: boolean, cycleStart: Date, now: Date, allUsers: any[]) {
    for (const kr of krs) {
        // Check-ins (Weekly)
        const weeks = isPast ? 12 : 8
        for (let w = 0; w < weeks; w++) {
            const checkInDate = new Date(cycleStart)
            checkInDate.setDate(checkInDate.getDate() + (w * 7))
            if (checkInDate > now) break

            await prisma.checkIn.create({
                data: {
                    keyResultId: kr.id,
                    userId: okr.ownerId,
                    weekStart: checkInDate,
                    value: isPast ? kr.target : Math.min(kr.target, (kr.current / weeks) * (w + 1)),
                    status: getRandom([CheckInStatus.GREEN, CheckInStatus.GREEN, CheckInStatus.YELLOW]),
                    comment: `Week ${w + 1} status update. Progress is steady and aligned with the quarterly roadmap.`
                }
            })
        }

        // Comments
        const commentCount = getRandomInt(1, 4)
        for (let c = 0; c < commentCount; c++) {
            await prisma.comment.create({
                data: {
                    content: getRandom(COMMENT_TEMPLATES),
                    userId: getRandom(allUsers).id,
                    objectiveId: okr.id,
                    keyResultId: kr.id
                }
            })
        }

        // Initiatives
        const initCount = getRandomInt(1, 3)
        for (let i = 0; i < initCount; i++) {
            await prisma.initiative.create({
                data: {
                    keyResultId: kr.id,
                    title: getRandom(INITIATIVE_TITLES),
                    status: isPast ? 'DONE' : getRandom(['TODO', 'DOING']),
                    notes: "Automated initiative created during system seeding."
                }
            })
        }
    }
}

// --- Main Seed Logic ---

export async function clearAndSeedDatabase() {
    console.log('--- STARTING MASSIVE ENTERPRISE SEED ---')
    const now = new Date()
    usedEmails.clear()

    // 1. CLEAR ALL (Resilient Truncation)
    const tables = [
        'notifications', 'comments', 'check_ins', 'initiatives', 'key_results',
        'objectives', 'team_members', 'teams', 'invitations', 'identity_provider_configs',
        'Account', 'Session', 'VerificationToken', 'users', 'organizations'
    ]

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`)
        } catch (e) {
            console.warn(`Could not truncate table ${table} (might not exist):`, (e as Error).message)
        }
    }
    console.log('Database cleared.')

    // 2. CREATE ORGANIZATION
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

    // 3. TEAMS (8)
    const teamNames = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'HR', 'Finance', 'Customer Success']
    const teams = await Promise.all(
        teamNames.map(name => prisma.team.create({ data: { name, orgId: org.id } }))
    )
    console.log(`Created ${teams.length} teams.`)

    // 4. USERS (110 total)
    const passwordHash = await hash('Pass@123', 10)
    const allUsers: any[] = []

    // Create Admins (5)
    for (let i = 0; i < 5; i++) {
        const name = i === 0 ? 'Admin Sarah' : generateFullName()
        const email = i === 0 ? 'admin@globaltech.dev' : generateEmail(name)
        if (i === 0) usedEmails.add(email)
        const user = await prisma.user.create({
            data: { email, name, role: Role.ADMIN, passwordHash, orgId: org.id }
        })
        allUsers.push(user)
    }

    // Create Managers (15)
    for (let i = 0; i < 15; i++) {
        const name = i === 0 ? 'Manager Alex' : generateFullName()
        const email = i === 0 ? 'manager@globaltech.dev' : generateEmail(name)
        if (i === 0) usedEmails.add(email)
        const team = teams[i % teams.length]
        const user = await prisma.user.create({
            data: {
                email, name, role: Role.MANAGER, passwordHash, orgId: org.id,
                teamMemberships: { create: { teamId: team.id, role: 'LEAD' } }
            },
            include: { teamMemberships: true }
        })
        allUsers.push(user)
    }

    // Create Employees (90)
    for (let i = 0; i < 90; i++) {
        const name = i === 0 ? 'Jordan Kim' : generateFullName()
        const email = i === 0 ? 'me@globaltech.dev' : generateEmail(name)
        if (i === 0) usedEmails.add(email)
        const team = teams[i % teams.length]
        const user = await prisma.user.create({
            data: {
                email, name, role: Role.EMPLOYEE, passwordHash, orgId: org.id,
                teamMemberships: { create: { teamId: team.id, role: 'MEMBER' } }
            },
            include: { teamMemberships: true }
        })
        allUsers.push(user)
    }
    console.log(`Created ${allUsers.length} total users.`)

    // 5. CYCLES (2023 Q4 to 2024 Q4)
    const CYCLES = [
        { label: 'FY23-24 Q3 (Oct-Dec)', start: new Date(2023, 9, 1), end: new Date(2023, 11, 31) },
        { label: 'FY23-24 Q4 (Jan-Mar)', start: new Date(2024, 0, 1), end: new Date(2024, 2, 31) },
        { label: 'FY24-25 Q1 (Apr-Jun)', start: new Date(2024, 3, 1), end: new Date(2024, 5, 30) },
        { label: 'FY24-25 Q2 (Jul-Sep)', start: new Date(2024, 6, 1), end: new Date(2024, 8, 30) },
        { label: 'FY24-25 Q3 (Oct-Dec)', start: new Date(2024, 9, 1), end: new Date(2024, 11, 31) }, // CURRENT
    ]

    // 6. GENERATE OKRS PER CYCLE
    for (let cycleIndex = 0; cycleIndex < CYCLES.length; cycleIndex++) {
        const cycle = CYCLES[cycleIndex]
        const isPast = cycleIndex < CYCLES.length - 1
        const isCurrent = cycleIndex === CYCLES.length - 1

        console.log(`Seeding cycle: ${cycle.label}...`)

        // A. COMPANY OKRS (3 per cycle)
        const companyOKRs: any[] = []
        const companyTitles = [
            ['Global Revenue Growth', 'New Market Expansion', 'Brand Presence'],
            ['Operational Efficiency', 'Customer Retention', 'Employee Engagement'],
            ['Product Innovation', 'Security Excellence', 'Market Dominance'],
            ['Sustainability Goals', 'AI Integration', 'Infrastructure Scale'],
            ['Enterprise Sales Boost', 'Design Language 2.0', 'Platform Stability']
        ]

        for (let i = 0; i < 3; i++) {
            const obj = await prisma.objective.create({
                data: {
                    title: companyTitles[cycleIndex][i],
                    description: `High-level strategic goal for ${cycle.label}. Focuses on long-term sustainability and market leadership.`,
                    ownerId: allUsers[i % 5].id, // Admins
                    cycle: cycle.label,
                    startAt: cycle.start,
                    endAt: cycle.end,
                    goalType: GoalType.COMPANY,
                    status: isPast ? ObjectiveStatus.DONE : ObjectiveStatus.IN_PROGRESS,
                    priority: 1,
                    weight: 33,
                    fiscalQuarter: getFiscalQuarter(cycle.start),
                    keyResults: {
                        create: [
                            { title: `KR 1 for ${companyTitles[cycleIndex][i]}`, target: 100, current: isPast ? 100 : getRandomInt(40, 80), weight: 40, unit: '%' },
                            { title: `KR 2 for ${companyTitles[cycleIndex][i]}`, target: 50, current: isPast ? 50 : getRandomInt(10, 30), weight: 60, unit: 'units' }
                        ]
                    }
                },
                include: { keyResults: true }
            })
            companyOKRs.push(obj)
            // Add activity for Company OKR
            await addActivityForOKR(obj, obj.keyResults, isPast, cycle.start, now, allUsers)
        }

        // B. TEAM OKRS (2 per team per cycle)
        for (const team of teams) {
            const teamManager = allUsers.find(u => u.role === Role.MANAGER && u.teamMemberships?.[0]?.teamId === team.id) || allUsers[5]

            for (let i = 0; i < 2; i++) {
                const parent = companyOKRs[i]
                const obj = await prisma.objective.create({
                    data: {
                        title: `${team.name} Goal: ${parent.title} Support`,
                        description: `Team level objective supporting ${parent.title}. Focuses on regional execution and department efficiency.`,
                        ownerId: teamManager.id,
                        teamId: team.id,
                        parentId: parent.id,
                        cycle: cycle.label,
                        startAt: cycle.start,
                        endAt: cycle.end,
                        goalType: GoalType.TEAM,
                        status: isPast ? ObjectiveStatus.DONE : (i === 1 && isCurrent ? ObjectiveStatus.AT_RISK : ObjectiveStatus.IN_PROGRESS),
                        priority: 2,
                        weight: 50,
                        fiscalQuarter: getFiscalQuarter(cycle.start),
                        keyResults: {
                            create: [
                                { title: `Team KR 1 - ${team.name}`, target: 100, current: isPast ? 100 : getRandomInt(20, 90), weight: 50, unit: '%' },
                                { title: `Team KR 2 - ${team.name}`, target: 10, current: isPast ? 10 : getRandomInt(1, 8), weight: 50, unit: 'count' }
                            ]
                        }
                    },
                    include: { keyResults: true }
                })
                // Add activity for Team OKR
                await addActivityForOKR(obj, obj.keyResults, isPast, cycle.start, now, allUsers)

                // C. INDIVIDUAL OKRS (Check for 5 random employees per team)
                const teamEmployees = allUsers.filter(u => u.role === Role.EMPLOYEE && u.teamMemberships?.[0]?.teamId === team.id).slice(0, 5)
                for (const employee of teamEmployees) {
                    const indObj = await prisma.objective.create({
                        data: {
                            title: `${employee.name.split(' ')[0]}'s ${cycle.label} Focus`,
                            description: `Personal growth and task execution for ${cycle.label}. Aligned with ${obj.title}.`,
                            ownerId: employee.id,
                            parentId: obj.id,
                            cycle: cycle.label,
                            startAt: cycle.start,
                            endAt: cycle.end,
                            goalType: GoalType.INDIVIDUAL,
                            status: isPast ? ObjectiveStatus.DONE : ObjectiveStatus.IN_PROGRESS,
                            priority: 3,
                            weight: 100,
                            fiscalQuarter: getFiscalQuarter(cycle.start),
                            keyResults: {
                                create: [
                                    { title: 'Personal KR 1', target: 100, current: isPast ? 100 : getRandomInt(50, 85), weight: 100, unit: '%' }
                                ]
                            }
                        },
                        include: { keyResults: true }
                    })
                    // Add activity for Individual OKR
                    await addActivityForOKR(indObj, indObj.keyResults, isPast, cycle.start, now, allUsers)
                }
            }
        }
    }

    console.log('--- RE-SEEDING COMPLETED SUCCESSFULLY ---')
}
