import { startOfQuarter, endOfQuarter, subDays, addDays, startOfWeek, endOfWeek, subWeeks, format } from 'date-fns'

import type { Objective } from '@/hooks/useObjectives'
import type { CheckInSummary, SummaryKeyResult, ProgressHeatmapRow } from '@/lib/checkin-summary'
import type { Comment } from '@/hooks/useComments'
import type { AppNotification } from '@/hooks/useNotifications'
import { calculateTrafficLightStatus, calculateObjectiveScore } from '@/lib/utils'

// --- Types & Helpers ---

const today = new Date()
const qStart = startOfQuarter(today).toISOString()
const qEnd = endOfQuarter(today).toISOString()
const qLabel = `Q${Math.floor((today.getMonth() + 3) / 3)} ${today.getFullYear()}`

// Roles
export const demoUsers = [
  // Leadership
  { id: 'u-ceo', name: 'Avery CEO', email: 'avery@okrflow.demo', role: 'ADMIN', avatar: 'AC' },
  { id: 'u-vp-sales', name: 'Marcus Sales', email: 'marcus@okrflow.demo', role: 'MANAGER', avatar: 'MS' },
  { id: 'u-vp-prod', name: 'Elena Product', email: 'elena@okrflow.demo', role: 'MANAGER', avatar: 'EP' },
  { id: 'u-vp-eng', name: 'David Eng', email: 'david@okrflow.demo', role: 'MANAGER', avatar: 'DE' },
  // Managers
  { id: 'u-m-growth', name: 'Sarah Growth', email: 'sarah@okrflow.demo', role: 'MANAGER', avatar: 'SG' },
  { id: 'u-m-platform', name: 'James Platform', email: 'james@okrflow.demo', role: 'MANAGER', avatar: 'JP' },
  // ICs (The user personas)
  { id: 'u-ic-prod', name: 'Alex PM', email: 'alex@okrflow.demo', role: 'EMPLOYEE', avatar: 'AP' },
  { id: 'u-ic-eng', name: 'Sam Dev', email: 'sam@okrflow.demo', role: 'EMPLOYEE', avatar: 'SD' },
  { id: 'u-ic-sales', name: 'Lisa AE', email: 'lisa@okrflow.demo', role: 'EMPLOYEE', avatar: 'LA' },
] as const

export const demoTeams = [
  { id: 't-exec', name: 'Executive', members: [demoUsers[0], demoUsers[1], demoUsers[2], demoUsers[3]] },
  { id: 't-sales', name: 'Sales', members: [demoUsers[1], demoUsers[8]] },
  { id: 't-product', name: 'Product', members: [demoUsers[2], demoUsers[4], demoUsers[6]] },
  { id: 't-eng', name: 'Engineering', members: [demoUsers[3], demoUsers[5], demoUsers[7]] },
  { id: 't-growth', name: 'Growth', members: [demoUsers[4], demoUsers[6], demoUsers[8]] },
  { id: 't-platform', name: 'Platform', members: [demoUsers[5], demoUsers[7]] },
]

// --- Generators ---

// 1. Objectives & Hierarchy

// Company Level
const objCompany1: Objective = {
  id: 'o-c-1',
  title: 'Achieve $10M ARR Milestone',
  description: 'Scale revenue through new market expansion and enterprise upsell.',
  cycle: qLabel,
  startAt: qStart,
  endAt: qEnd,
  goalType: 'COMPANY',
  progressType: 'AUTOMATIC',
  progress: 72,
  status: 'ON_TRACK', // mapped later
  score: 0.72,
  owner: demoUsers[0],
  team: demoTeams[0],
  parent: null,
  children: [], // Populated later
  keyResults: [
    { id: 'kr-c-1-1', title: 'Reach $10M ARR', weight: 40, target: 10000000, current: 8500000, unit: 'USD', progress: 85, initiativeCount: 2 },
    { id: 'kr-c-1-2', title: 'New Market Expansion (APAC)', weight: 30, target: 1000000, current: 450000, unit: 'USD', progress: 45, initiativeCount: 3 },
    { id: 'kr-c-1-3', title: 'Enterprise Logo Retention > 95%', weight: 30, target: 95, current: 92, unit: '%', progress: 96, initiativeCount: 1 },
  ],
}

const objCompany2: Objective = {
  id: 'o-c-2',
  title: 'World-Class Product Experience',
  description: 'Deliver a seamless, high-performance experience to reduce churn.',
  cycle: qLabel,
  startAt: qStart,
  endAt: qEnd,
  goalType: 'COMPANY',
  progressType: 'AUTOMATIC',
  progress: 58,
  status: 'AT_RISK',
  score: 0.58,
  owner: demoUsers[2],
  team: demoTeams[0],
  parent: null,
  children: [],
  keyResults: [
    { id: 'kr-c-2-1', title: 'Reduce Churn to < 5%', weight: 40, target: 5, current: 6.2, unit: '%', progress: 60, initiativeCount: 2 },
    { id: 'kr-c-2-2', title: 'Raise NPS to 60', weight: 30, target: 60, current: 48, unit: 'score', progress: 50, initiativeCount: 2 },
    { id: 'kr-c-2-3', title: 'Launch Mobile App', weight: 30, target: 100, current: 70, unit: '%', progress: 70, initiativeCount: 4 },
  ],
}

// Team Level (Sales)
const objTeamSales1: Objective = {
  id: 'o-t-s-1',
  title: 'Dominate Enterprise Market',
  description: 'Secure 10 Fortune 500 logos.',
  cycle: qLabel,
  startAt: qStart,
  endAt: qEnd,
  goalType: 'TEAM',
  progressType: 'AUTOMATIC',
  progress: 65,
  status: 'ON_TRACK',
  score: 0.65,
  owner: demoUsers[1],
  team: demoTeams[1],
  parent: { id: objCompany1.id, title: objCompany1.title },
  children: [],
  keyResults: [
    { id: 'kr-t-s-1-1', title: 'Close 10 Enterprise Deals', weight: 50, target: 10, current: 6, unit: 'deals', progress: 60, initiativeCount: 5 },
    { id: 'kr-t-s-1-2', title: 'Generate $5M Pipeline', weight: 50, target: 5000000, current: 3500000, unit: 'USD', progress: 70, initiativeCount: 3 },
  ],
}

// Team Level (Product)
const objTeamProd1: Objective = {
  id: 'o-t-p-1',
  title: 'Revamp Onboarding Flow',
  description: 'Improve activation rates for new signups.',
  cycle: qLabel,
  startAt: qStart,
  endAt: qEnd,
  goalType: 'TEAM',
  progressType: 'AUTOMATIC',
  progress: 42,
  status: 'AT_RISK', // Yellow
  score: 0.42,
  owner: demoUsers[4], // Sarah Growth (Product works with Growth)
  team: demoTeams[2],
  parent: { id: objCompany2.id, title: objCompany2.title },
  children: [],
  keyResults: [
    { id: 'kr-t-p-1-1', title: 'Activation Rate > 40%', weight: 60, target: 40, current: 28, unit: '%', progress: 40, initiativeCount: 2 },
    { id: 'kr-t-p-1-2', title: 'Reduce Time to Value < 2 days', weight: 40, target: 2, current: 3.5, unit: 'days', progress: 45, initiativeCount: 3 },
  ],
}

// Team Level (Engineering)
const objTeamEng1: Objective = {
  id: 'o-t-e-1',
  title: 'Scale Infrastructure 10x',
  description: 'Prepare platform for enterprise load.',
  cycle: qLabel,
  startAt: qStart,
  endAt: qEnd,
  goalType: 'TEAM',
  progressType: 'AUTOMATIC',
  progress: 88,
  status: 'ON_TRACK',
  score: 0.88,
  owner: demoUsers[3],
  team: demoTeams[3],
  parent: { id: objCompany2.id, title: objCompany2.title },
  children: [],
  keyResults: [
    { id: 'kr-t-e-1-1', title: '99.99% Uptime', weight: 50, target: 99.99, current: 99.95, unit: '%', progress: 90, initiativeCount: 1 },
    { id: 'kr-t-e-1-2', title: 'Migrate to Kubernetes', weight: 50, target: 100, current: 85, unit: '%', progress: 85, initiativeCount: 2 },
  ],
}

// Individual Level (IC Role - Alex PM)
const objIcAlex1: Objective = {
  id: 'o-i-a-1',
  title: 'Launch Self-Serve Analytics',
  description: 'Empower users to build their own reports.',
  cycle: qLabel,
  startAt: qStart,
  endAt: qEnd,
  goalType: 'INDIVIDUAL',
  progressType: 'AUTOMATIC',
  progress: 30,
  status: 'OFF_TRACK', // Red
  score: 0.3,
  owner: demoUsers[6], // Alex PM
  team: demoTeams[2],
  parent: { id: objTeamProd1.id, title: objTeamProd1.title },
  children: [],
  keyResults: [
    { id: 'kr-i-a-1-1', title: 'Beta Release to 50 users', weight: 50, target: 50, current: 10, unit: 'users', progress: 20, initiativeCount: 4 },
    { id: 'kr-i-a-1-2', title: 'Feature Adoption 20%', weight: 50, target: 20, current: 8, unit: '%', progress: 40, initiativeCount: 1 },
  ],
}

// Individual Level (IC Role - Sam Dev)
const objIcSam1: Objective = {
  id: 'o-i-s-1',
  title: 'Refactor Legacy API',
  description: 'Improve response times and maintainability.',
  cycle: qLabel,
  startAt: qStart,
  endAt: qEnd,
  goalType: 'INDIVIDUAL',
  progressType: 'AUTOMATIC',
  progress: 92,
  status: 'ON_TRACK',
  score: 0.92,
  owner: demoUsers[7], // Sam Dev
  team: demoTeams[3],
  parent: { id: objTeamEng1.id, title: objTeamEng1.title },
  children: [],
  keyResults: [
    { id: 'kr-i-s-1-1', title: 'Reduce API Latency < 100ms', weight: 100, target: 100, current: 95, unit: 'ms', progress: 92, initiativeCount: 1 },
  ],
}

// Link children
objCompany1.children?.push({ id: objTeamSales1.id, title: objTeamSales1.title })
objCompany2.children?.push({ id: objTeamProd1.id, title: objTeamProd1.title }, { id: objTeamEng1.id, title: objTeamEng1.title })
objTeamProd1.children?.push({ id: objIcAlex1.id, title: objIcAlex1.title })
objTeamEng1.children?.push({ id: objIcSam1.id, title: objIcSam1.title })

function computeStatus(progress: number) {
  if (progress >= 70) return 'DONE'
  if (progress >= 40) return 'IN_PROGRESS'
  return 'AT_RISK'
}

// Final List
export const demoObjectives: Objective[] = [
  objCompany1, objCompany2,
  objTeamSales1, objTeamProd1, objTeamEng1,
  objIcAlex1, objIcSam1
].map(o => ({ ...o, status: computeStatus(o.progress) as any }))


// 2. Check-ins & History
// We generate a "Recent Check-in" history for the dashboard feed.
// Ensure objectiveId is present !!

export const demoRecentCheckIns = [
  {
    id: 'ci-1',
    keyResultId: 'kr-t-e-1-1',
    keyResultTitle: '99.99% Uptime',
    objectiveId: objTeamEng1.id,
    objectiveTitle: objTeamEng1.title,
    ownerName: 'David Eng',
    ownerEmail: 'david@okrflow.demo',
    status: 'GREEN' as const,
    value: 99.95,
    comment: 'Stable all week. No incidents.',
    weekStart: subDays(new Date(), 2),
  },
  {
    id: 'ci-2',
    keyResultId: 'kr-c-2-1',
    keyResultTitle: 'Reduce Churn to < 5%',
    objectiveId: objCompany2.id,
    objectiveTitle: objCompany2.title,
    ownerName: 'Elena Product',
    ownerEmail: 'elena@okrflow.demo',
    status: 'YELLOW' as const,
    value: 6.2,
    comment: 'Churn ticked up slightly due to legacy pricing migration.',
    weekStart: subDays(new Date(), 4),
  },
  {
    id: 'ci-3',
    keyResultId: 'kr-t-s-1-1',
    keyResultTitle: 'Close 10 Enterprise Deals',
    objectiveId: objTeamSales1.id,
    objectiveTitle: objTeamSales1.title,
    ownerName: 'Marcus Sales',
    ownerEmail: 'marcus@okrflow.demo',
    status: 'GREEN' as const,
    value: 60,
    comment: '2 big logos signed yesterday! On track.',
    weekStart: subDays(new Date(), 1),
  },
  {
    id: 'ci-4',
    keyResultId: 'kr-i-a-1-1',
    keyResultTitle: 'Beta Release to 50 users',
    objectiveId: objIcAlex1.id,
    objectiveTitle: objIcAlex1.title,
    ownerName: 'Alex PM',
    ownerEmail: 'alex@okrflow.demo',
    status: 'RED' as const,
    value: 20,
    comment: 'Blocked by authentication bug. Engineering investigating.',
    weekStart: subDays(new Date(), 0), // Today
  }
]

// 3. Summaries & Heatmaps

export const demoCheckInSummary: CheckInSummary = {
  hero: {
    avgProgress: Math.round(demoObjectives.reduce((acc, o) => acc + o.progress, 0) / demoObjectives.length),
    completionRate: 45,
    atRiskObjectives: 2,
    objectiveCount: demoObjectives.length,
    scoreAverage: 0.65,
  },
  weeklySummary: {
    onTrack: 12,
    atRisk: 5,
    offTrack: 2,
    dueThisWeek: 4,
  },
  teamHeatmap: [
    { teamId: 't-eng', teamName: 'Engineering', progress: 88, status: 'green', objectiveCount: 2, memberCount: 3 },
    { teamId: 't-sales', teamName: 'Sales', progress: 65, status: 'yellow', objectiveCount: 1, memberCount: 2 },
    { teamId: 't-product', teamName: 'Product', progress: 42, status: 'red', objectiveCount: 3, memberCount: 3 },
    { teamId: 't-growth', teamName: 'Growth', progress: 70, status: 'green', objectiveCount: 1, memberCount: 3 },
  ],
  heatmap: [
    // This drives the 'Pulse' view - taking a few KRs
    {
      keyResultId: 'kr-t-e-1-1',
      keyResultTitle: '99.99% Uptime',
      objectiveTitle: objTeamEng1.title,
      ownerName: 'David Eng',
      weeklyProgress: [
        { value: 98, status: 'green', date: subWeeks(today, 3) },
        { value: 99, status: 'green', date: subWeeks(today, 2) },
        { value: 99.5, status: 'green', date: subWeeks(today, 1) },
        { value: 99.95, status: 'green', date: today },
      ]
    },
    {
      keyResultId: 'kr-c-2-1',
      keyResultTitle: 'Reduce Churn',
      objectiveTitle: objCompany2.title,
      ownerName: 'Elena Product',
      weeklyProgress: [
        { value: 7.0, status: 'red', date: subWeeks(today, 3) },
        { value: 6.8, status: 'red', date: subWeeks(today, 2) },
        { value: 6.5, status: 'yellow', date: subWeeks(today, 1) },
        { value: 6.2, status: 'yellow', date: today },
      ]
    }
  ],
  alignment: [
    // Simplified tree for the alignment map
    {
      id: objCompany1.id,
      title: objCompany1.title,
      progress: objCompany1.progress,
      owner: objCompany1.owner.name,
      goalType: 'COMPANY',
      children: [
        {
          id: objTeamSales1.id,
          title: objTeamSales1.title,
          progress: objTeamSales1.progress,
          owner: objTeamSales1.owner.name,
          goalType: 'TEAM',
        }
      ]
    },
    {
      id: objCompany2.id,
      title: objCompany2.title,
      progress: objCompany2.progress,
      owner: objCompany2.owner.name,
      goalType: 'COMPANY',
      children: [
        {
          id: objTeamEng1.id,
          title: objTeamEng1.title,
          progress: objTeamEng1.progress,
          owner: objTeamEng1.owner.name,
          goalType: 'TEAM',
          children: [
            { id: objIcSam1.id, title: objIcSam1.title, progress: objIcSam1.progress, owner: objIcSam1.owner.name, goalType: 'INDIVIDUAL' }
          ]
        },
        {
          id: objTeamProd1.id,
          title: objTeamProd1.title,
          progress: objTeamProd1.progress,
          owner: objTeamProd1.owner.name,
          goalType: 'TEAM',
          children: [
            { id: objIcAlex1.id, title: objIcAlex1.title, progress: objIcAlex1.progress, owner: objIcAlex1.owner.name, goalType: 'INDIVIDUAL' }
          ]
        }
      ]
    }
  ],
  recentCheckIns: demoRecentCheckIns,
}

export const demoComments: Comment[] = [
  {
    id: 'cm-1',
    content: 'Are we on track for the enterprise features?',
    objectiveId: objCompany1.id,
    keyResultId: 'kr-c-1-3',
    createdAt: subDays(today, 1).toISOString(),
    user: demoUsers[1],
  },
  {
    id: 'cm-2',
    content: 'Yes, engineering has shipped the beta APIs.',
    objectiveId: objCompany1.id,
    keyResultId: 'kr-c-1-3',
    createdAt: subDays(today, 0).toISOString(),
    user: demoUsers[3],
  }
]

export const demoNotifications: AppNotification[] = [
  {
    id: 'n-1',
    userId: 'u-ic-prod',
    type: 'checkin',
    message: 'Weekly check-in due for "Launch Self-Serve Analytics"',
    read: false,
    metadata: null,
    createdAt: subDays(today, 1).toISOString(),
  },
  {
    id: 'n-2',
    userId: 'u-ic-prod',
    type: 'comment',
    message: 'Elena commented on your Key Result',
    read: true,
    metadata: null,
    createdAt: subDays(today, 2).toISOString(),
  }
]

export const demoInitiatives = [] // Can populate if needed
export const demoNotificationSettings = {
  emailCheckInReminders: true,
  emailWeeklyDigest: true,
  emailObjectiveUpdates: true,
  pushCheckInReminders: true,
  pushObjectiveComments: true,
  pushDeadlineAlerts: true,
}
