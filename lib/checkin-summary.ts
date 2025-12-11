import { eachWeekOfInterval, isEqual, startOfWeek, subWeeks } from 'date-fns'

import { calculateObjectiveScore, calculateTrafficLightStatus, type TrafficLightStatus } from '@/lib/utils'

export type SummaryCheckIn = {
  weekStart: Date
  value: number
  status: 'GREEN' | 'YELLOW' | 'RED'
  comment?: string | null
}

export type SummaryKeyResult = {
  id: string
  title: string
  target: number
  current: number
  weight: number
  objectiveTitle: string
  ownerName: string
  ownerEmail: string
  checkIns: SummaryCheckIn[]
}

export type ProgressHeatmapRow = {
  keyResultId: string
  keyResultTitle: string
  objectiveTitle: string
  ownerName: string
  weeklyProgress: Array<{
    value: number
    status: TrafficLightStatus
    date: Date
  }>
}

export type TeamHeatmapEntry = {
  teamId: string
  teamName: string
  progress: number
  status: TrafficLightStatus
  objectiveCount: number
  memberCount: number
}

export type AlignmentNode = {
  id: string
  title: string
  progress: number
  owner: string
  teamName?: string | null
  goalType?: string | null
  children?: AlignmentNode[]
}

export type WeeklySummary = {
  onTrack: number
  atRisk: number
  offTrack: number
  dueThisWeek: number
}

export type HeroSummary = {
  avgProgress: number
  completionRate: number
  atRiskObjectives: number
  objectiveCount: number
  scoreAverage: number
}

export type CheckInSummary = {
  hero: HeroSummary
  weeklySummary: WeeklySummary
  heatmap: ProgressHeatmapRow[]
  teamHeatmap: TeamHeatmapEntry[]
  alignment: AlignmentNode[]
  recentCheckIns: Array<{
    id: string
    keyResultId: string
    keyResultTitle: string
    objectiveTitle: string
    ownerName: string
    ownerEmail: string
    status: 'GREEN' | 'YELLOW' | 'RED'
    value: number
    comment?: string | null
    weekStart: Date
  }>
}

export function buildProgressHeatmap(
  keyResults: SummaryKeyResult[],
  today: Date = new Date()
): ProgressHeatmapRow[] {
  const endOfRange = startOfWeek(today, { weekStartsOn: 1 })
  const weeks = eachWeekOfInterval(
    { start: subWeeks(endOfRange, 4), end: endOfRange },
    { weekStartsOn: 1 }
  )

  return keyResults.map((kr) => ({
    keyResultId: kr.id,
    keyResultTitle: kr.title,
    objectiveTitle: kr.objectiveTitle,
    ownerName: kr.ownerName || kr.ownerEmail,
    weeklyProgress: weeks.map((week) => {
      const matching = kr.checkIns.find((checkIn) => isEqual(new Date(checkIn.weekStart), week))
      const value = matching ? Math.round(matching.value) : 0
      return {
        value,
        status: calculateTrafficLightStatus(value),
        date: week,
      }
    }),
  }))
}

export function buildWeeklySummary(rows: ProgressHeatmapRow[], today: Date = new Date()): WeeklySummary {
  const start = startOfWeek(today, { weekStartsOn: 1 })
  let onTrack = 0
  let atRisk = 0
  let offTrack = 0
  let dueThisWeek = 0

  rows.forEach((row) => {
    if (!row.weeklyProgress.length) {
      dueThisWeek += 1
      return
    }

    const latest = row.weeklyProgress.reduce((prev, curr) =>
      curr.date > prev.date ? curr : prev
    )

    if (latest.date < start || latest.value === 0) {
      dueThisWeek += 1
    }

    switch (latest.status) {
      case 'green':
        onTrack += 1
        break
      case 'yellow':
        atRisk += 1
        break
      case 'red':
        offTrack += 1
        break
    }
  })

  return { onTrack, atRisk, offTrack, dueThisWeek }
}

export function buildTeamHeatmap(objectives: Array<{
  teamId?: string | null
  teamName?: string | null
  ownerEmail: string
  progress: number
}>): TeamHeatmapEntry[] {
  const map = new Map<string, {
    teamId: string
    teamName: string
    totalProgress: number
    objectiveCount: number
    memberEmails: Set<string>
  }>()

  objectives.forEach((objective) => {
    const teamId = objective.teamId || 'unassigned'
    const teamName = objective.teamName || 'Unassigned'

    if (!map.has(teamId)) {
      map.set(teamId, {
        teamId,
        teamName,
        totalProgress: 0,
        objectiveCount: 0,
        memberEmails: new Set<string>(),
      })
    }

    const node = map.get(teamId)!
    node.totalProgress += objective.progress
    node.objectiveCount += 1
    node.memberEmails.add(objective.ownerEmail)
  })

  return Array.from(map.values()).map((team) => {
    const progress = team.objectiveCount ? Math.round(team.totalProgress / team.objectiveCount) : 0
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      progress,
      status: calculateTrafficLightStatus(progress),
      objectiveCount: team.objectiveCount,
      memberCount: team.memberEmails.size || 1,
    }
  })
}

type AlignmentInput = {
  id: string
  title: string
  progress: number
  ownerName?: string | null
  ownerEmail: string
  parentId?: string | null
  teamName?: string | null
  goalType?: string | null
}

export function buildAlignmentTree(items: AlignmentInput[]): AlignmentNode[] {
  const map = new Map<string, AlignmentNode & { parentId?: string | null }>()

  items.forEach((item) => {
    map.set(item.id, {
      id: item.id,
      title: item.title,
      progress: item.progress,
      owner: item.ownerName || item.ownerEmail,
      teamName: item.teamName,
      goalType: item.goalType,
      parentId: item.parentId,
      children: [],
    })
  })

  const roots: AlignmentNode[] = []

  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      const parent = map.get(node.parentId)!
      parent.children = parent.children || []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
    delete node.parentId
  })

  return roots
}

export function buildHeroSummary(objectives: Array<{ progress: number; status?: string; score?: number | null }>): HeroSummary {
  if (!objectives.length) {
    return {
      avgProgress: 0,
      completionRate: 0,
      atRiskObjectives: 0,
      objectiveCount: 0,
      scoreAverage: 0,
    }
  }

  const objectiveCount = objectives.length
  const avgProgress = Math.round(objectives.reduce((sum, o) => sum + (o.progress || 0), 0) / objectiveCount)
  const completionRate = Math.round(
    (objectives.filter((o) => o.status === 'DONE').length / objectiveCount) * 100
  )
  const atRiskObjectives = objectives.filter((o) => o.status === 'AT_RISK').length
  const scoreAverage = Number(
    (
      objectives.reduce(
        (sum, o) => sum + (typeof o.score === 'number' ? o.score : calculateObjectiveScore(o.progress)),
        0
      ) / objectiveCount
    ).toFixed(2)
  )

  return {
    avgProgress,
    completionRate,
    atRiskObjectives,
    objectiveCount,
    scoreAverage,
  }
}
