import { PrismaClient, Role, CheckInStatus, ObjectiveStatus } from '@prisma/client'
import { hash } from 'bcryptjs'
import { getIndianFiscalQuarter } from '../lib/india'
const prisma = new PrismaClient()
async function main() {
  let org = await prisma.organization.findFirst({
    where: { name: 'OKRFlow India Demo' },
  })

  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'OKRFlow India Demo' },
    })
  }

  const [admin, manager, meUser] = await Promise.all([
    upsertUser('admin@okrflow.test', 'Aditi Rao', Role.ADMIN, org.id),
    upsertUser('manager@okrflow.test', 'Manish Iyer', Role.MANAGER, org.id),
    upsertUser('me@okrflow.test', 'Meena Patel', Role.EMPLOYEE, org.id),
  ])
  await prisma.objective.deleteMany({ where: { ownerId: { in: [admin.id, manager.id, meUser.id] } } })
  await prisma.team.deleteMany({ where: { orgId: org.id } })
  const [salesTeam, operationsTeam, complianceTeam] = await Promise.all([
    prisma.team.create({ data: { name: 'Sales (India)', orgId: org.id } }),
    prisma.team.create({ data: { name: 'Operations', orgId: org.id } }),
    prisma.team.create({ data: { name: 'Compliance', orgId: org.id } }),
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
  const growMrr = await createObjectiveWithKRs({
    ownerId: manager.id,
    teamId: salesTeam.id,
    status: ObjectiveStatus.IN_PROGRESS,
    title: 'Grow MRR to ₹50L',
    description: 'Localise pricing and double fintech conversions across metro markets.',
    cycle: q1.label,
    startAt: q1.start,
    endAt: q1.end,
    keyResults: [
      { title: 'Leads→Demos pipeline value', weight: 40, target: 5_000_000, current: 2_400_000, unit: '₹' },
      { title: 'Demos→Paid conversion rate', weight: 35, target: 35, current: 26, unit: '%' },
      { title: 'Churn <3%', weight: 25, target: 3, current: 4.1, unit: '%' },
    ],
  })

  const gstCompliance = await createObjectiveWithKRs({
    ownerId: meUser.id,
    teamId: complianceTeam.id,
    status: ObjectiveStatus.AT_RISK,
    title: 'GST Compliance Objective',
    description: 'Stabilise GST filings and reduce amendment cycles for enterprise customers.',
    cycle: q1.label,
    startAt: q1.start,
    endAt: q1.end,
    keyResults: [
      { title: 'File monthly returns on schedule', weight: 55, target: 12, current: 5, unit: 'filings' },
      { title: 'Reduce filing errors <1%', weight: 45, target: 1, current: 2.6, unit: '%' },
    ],
  })

  const deliverySla = await createObjectiveWithKRs({
    ownerId: admin.id,
    teamId: operationsTeam.id,
    status: ObjectiveStatus.DONE,
    title: 'Improve Delivery SLA',
    description: 'Scale fulfilment ops to keep regional deliveries under three days.',
    cycle: q2.label,
    startAt: q2.start,
    endAt: q2.end,
    keyResults: [
      { title: 'Average delivery time <3 days', weight: 60, target: 3, current: 2.5, unit: 'days' },
      { title: 'SLA adherence >95%', weight: 40, target: 95, current: 96.2, unit: '%' },
    ],
  })

  await prisma.initiative.createMany({
    data: [
      { keyResultId: growMrr.keyResults[0].id, title: 'Partner with Razorpay', status: 'DOING' },
      { keyResultId: gstCompliance.keyResults[0].id, title: 'Automate GST filing', status: 'TODO' },
    ],
  })

  console.log(`
Seed complete:
 - Organisation: OKRFlow India Demo
 - Teams: Sales (India), Operations, Compliance
 - Users: admin@okrflow.test, manager@okrflow.test, me@okrflow.test (password: Pass@123)
 - Objectives seeded with Indian fiscal quarters, GST microcopy, and live check-ins`)
}

async function upsertUser(email: string, name: string, role: Role, orgId: string) {
  const passwordHash = await hash('Pass@123', 10)
  return prisma.user.upsert({
    where: { email },
    update: { name, role, orgId, passwordHash },
    create: { email, name, role, orgId, passwordHash },
  })
}
type ObjectiveSeedInput = {
  ownerId: string
  teamId: string
  status: ObjectiveStatus
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
      title: input.title,
      description: input.description,
      cycle: input.cycle,
      startAt: input.startAt,
      endAt: input.endAt,
      fiscalQuarter: getIndianFiscalQuarter(input.startAt),
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
              ? 'Needs unblocker from finance this sprint.'
              : status === CheckInStatus.YELLOW
                ? 'Watching risk trend closely.'
                : 'Weekly momentum looks good.',
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
