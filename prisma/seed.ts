import { PrismaClient, Role, CheckInStatus, ObjectiveStatus, GoalType } from '@prisma/client'
import { hash } from 'bcryptjs'
import { getFiscalQuarter } from '../lib/india'
const prisma = new PrismaClient()
async function main() {
  let org = await prisma.organization.findFirst({
    where: { name: 'TechFlow Solutions' },
  })

  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'TechFlow Solutions' },
    })
  }

  const [admin, manager, meUser] = await Promise.all([
    upsertUser('admin@techflow.dev', 'Sarah Chen', Role.ADMIN, org.id),
    upsertUser('manager@techflow.dev', 'Alex Rodriguez', Role.MANAGER, org.id),
    upsertUser('me@techflow.dev', 'Jordan Kim', Role.EMPLOYEE, org.id),
  ])
  await prisma.objective.deleteMany({ where: { ownerId: { in: [admin.id, manager.id, meUser.id] } } })
  await prisma.team.deleteMany({ where: { orgId: org.id } })
  const [frontendTeam, backendTeam, devopsTeam] = await Promise.all([
    prisma.team.create({ data: { name: 'Frontend Team', orgId: org.id } }),
    prisma.team.create({ data: { name: 'Backend Team', orgId: org.id } }),
    prisma.team.create({ data: { name: 'DevOps Team', orgId: org.id } }),
  ])
  const now = new Date()
  const fyStartYear = now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
  const fyLabel = `FY${String(fyStartYear + 1).slice(-2)}`
  const q1 = {
    start: new Date(Date.UTC(fyStartYear, 3, 1)),
    end: new Date(Date.UTC(fyStartYear, 5, 30, 23, 59, 59)),
    label: `${fyLabel} Q1 (Apr-Jun)`,
  }
  const q2 = {
    start: new Date(Date.UTC(fyStartYear, 6, 1)),
    end: new Date(Date.UTC(fyStartYear, 8, 30, 23, 59, 59)),
    label: `${fyLabel} Q2 (Jul-Sep)`,
  }
  const userAdoption = await createObjectiveWithKRs({
    ownerId: manager.id,
    teamId: frontendTeam.id,
    status: ObjectiveStatus.IN_PROGRESS,
    goalType: GoalType.TEAM,
    title: 'Increase User Adoption by 40%',
    description: 'Improve user onboarding and feature adoption through enhanced UX and onboarding flows.',
    cycle: q1.label,
    startAt: q1.start,
    endAt: q1.end,
    keyResults: [
      { title: 'Weekly active users', weight: 40, target: 50000, current: 32000, unit: 'users' },
      { title: 'Feature adoption rate', weight: 35, target: 75, current: 58, unit: '%' },
      { title: 'User retention (30-day)', weight: 25, target: 85, current: 78, unit: '%' },
    ],
  })

  const apiPerformance = await createObjectiveWithKRs({
    ownerId: meUser.id,
    teamId: backendTeam.id,
    status: ObjectiveStatus.AT_RISK,
    goalType: GoalType.TEAM,
    title: 'Improve API Performance by 50%',
    description: 'Optimize backend services and reduce response times for better user experience.',
    cycle: q1.label,
    startAt: q1.start,
    endAt: q1.end,
    keyResults: [
      { title: 'API response time <200ms', weight: 55, target: 200, current: 350, unit: 'ms' },
      { title: 'Reduce error rate <0.1%', weight: 45, target: 0.1, current: 0.8, unit: '%' },
    ],
  })

  const deploymentReliability = await createObjectiveWithKRs({
    ownerId: admin.id,
    teamId: devopsTeam.id,
    status: ObjectiveStatus.DONE,
    goalType: GoalType.TEAM,
    title: 'Achieve 99.9% Deployment Uptime',
    description: 'Implement automated CI/CD pipelines and monitoring to ensure reliable deployments.',
    cycle: q2.label,
    startAt: q2.start,
    endAt: q2.end,
    keyResults: [
      { title: 'Deployment success rate >99%', weight: 60, target: 99, current: 99.2, unit: '%' },
      { title: 'MTTR <1 hour', weight: 40, target: 1, current: 0.8, unit: 'hours' },
    ],
  })

  await prisma.initiative.createMany({
    data: [
      { keyResultId: userAdoption.keyResults[0].id, title: 'Implement onboarding wizard', status: 'DOING' },
      { keyResultId: apiPerformance.keyResults[0].id, title: 'Optimize database queries', status: 'TODO' },
    ],
  })

  console.log(`
Seed complete:
 - Organisation: TechFlow Solutions
 - Teams: Frontend Team, Backend Team, DevOps Team
 - Users: admin@techflow.dev, manager@techflow.dev, me@techflow.dev (password: Pass@123)
 - Objectives seeded with user adoption, API performance, and deployment reliability goals`)
}

async function upsertUser(email: string, name: string, role: Role, orgId: string) {
  const password = await hash('Pass@123', 10)
  return prisma.user.upsert({
    where: { email },
    update: { name, role, orgId, password },
    create: { email, name, role, orgId, password },
  })
}
type ObjectiveSeedInput = {
  ownerId: string
  teamId: string
  status: ObjectiveStatus
  goalType: GoalType
  title: string
  description: string
  cycle: string
  startAt: Date
  endAt: Date
  keyResults: Array<{
    title: string
    weight: number
    target: number
    current: number
    unit?: string | null
  }>
}
async function createObjectiveWithKRs(input: ObjectiveSeedInput) {
  const objective = await prisma.objective.create({
    data: {
      ownerId: input.ownerId,
      teamId: input.teamId,
      status: input.status,
      goalType: input.goalType,
      title: input.title,
      description: input.description,
      cycle: input.cycle,
      startAt: input.startAt,
      endAt: input.endAt,
      fiscalQuarter: getFiscalQuarter(input.startAt),
    },
  })

  const keyResults = await prisma.keyResult.createManyAndReturn({
    data: input.keyResults.map((kr) => ({
      ...kr,
      objectiveId: objective.id,
    })),
  })

  await seedCheckIns(objective.ownerId, keyResults)

  return { objective, keyResults }
}
async function seedCheckIns(ownerId: string, keyResults: Array<{ id: string; current: number; target: number }>) {
  const baseMonday = startOfWeek(new Date())
  const statuses = [CheckInStatus.GREEN, CheckInStatus.YELLOW, CheckInStatus.RED]

  for (let index = 0; index < keyResults.length; index++) {
    const kr = keyResults[index]
    for (const weekOffset of [1, 2]) {
      const weekStart = new Date(baseMonday)
      weekStart.setUTCDate(weekStart.getUTCDate() - weekOffset * 7)
      const progress = clamp(percent(kr.current, kr.target) + (index - weekOffset) * 4)
      const status = statuses[(index + weekOffset) % statuses.length]

      await prisma.checkIn.create({
        data: {
          keyResultId: kr.id,
          userId: ownerId,
          weekStart,
          value: progress,
          status,
          comment:
            status === CheckInStatus.RED
              ? 'Blocked by dependency on backend API changes.'
              : status === CheckInStatus.YELLOW
                ? 'Monitoring performance metrics closely.'
                : 'Sprint velocity is on track.',
        },
      })
    }
  }
}
function percent(current: number, target: number) {
  if (!isFinite(current) || !isFinite(target) || target === 0) return 0
  return (current / target) * 100
}
function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}
function startOfWeek(date: Date) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = copy.getUTCDay()
  const diff = (day + 6) % 7
  copy.setUTCDate(copy.getUTCDate() - diff)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}
main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
