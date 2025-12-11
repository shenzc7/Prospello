import {
  buildAlignmentTree,
  buildProgressHeatmap,
  buildTeamHeatmap,
  buildWeeklySummary,
  type SummaryKeyResult,
} from '@/lib/checkin-summary'

describe('checkin-summary helpers', () => {
  const baseDate = new Date('2024-01-15T00:00:00Z') // Tuesday of ISO week starting Jan 15

  const keyResults: SummaryKeyResult[] = [
    {
      id: 'kr-1',
      title: 'Reduce latency',
      target: 100,
      current: 80,
      weight: 50,
      objectiveTitle: 'Performance',
      ownerName: 'Alex',
      ownerEmail: 'alex@example.com',
      checkIns: [
        { weekStart: new Date('2024-01-15T00:00:00Z'), value: 80, status: 'GREEN' },
        { weekStart: new Date('2024-01-08T00:00:00Z'), value: 40, status: 'YELLOW' },
      ],
    },
    {
      id: 'kr-2',
      title: 'Increase NPS',
      target: 100,
      current: 20,
      weight: 50,
      objectiveTitle: 'Customer',
      ownerName: 'Jamie',
      ownerEmail: 'jamie@example.com',
      checkIns: [
        { weekStart: new Date('2024-01-08T00:00:00Z'), value: 20, status: 'RED' },
      ],
    },
  ]

  it('builds progress heatmap with 5 weeks of data', () => {
    const heatmap = buildProgressHeatmap(keyResults, baseDate)
    expect(heatmap).toHaveLength(2)
    expect(heatmap[0].weeklyProgress).toHaveLength(5)
    expect(heatmap[0].weeklyProgress.at(-1)?.value).toBe(80)
    expect(heatmap[1].weeklyProgress.at(-1)?.value).toBe(0)
  })

  it('derives weekly summary counts including due items', () => {
    const heatmap = buildProgressHeatmap(keyResults, baseDate)
    const summary = buildWeeklySummary(heatmap, baseDate)
    expect(summary.onTrack).toBe(1)
    expect(summary.offTrack).toBe(1)
    expect(summary.dueThisWeek).toBe(1) // second KR has no update this week
  })

  it('aggregates team heatmap status by average progress', () => {
    const teams = buildTeamHeatmap([
      { teamId: 't1', teamName: 'Growth', ownerEmail: 'alex@example.com', progress: 80 },
      { teamId: 't1', teamName: 'Growth', ownerEmail: 'jamie@example.com', progress: 40 },
    ])
    expect(teams).toHaveLength(1)
    expect(teams[0].progress).toBe(60)
    expect(teams[0].status).toBe('yellow')
  })

  it('builds alignment tree with parent-child links', () => {
    const nodes = buildAlignmentTree([
      { id: 'obj-1', title: 'Company North Star', progress: 70, ownerEmail: 'ceo@example.com', parentId: null, teamName: 'Exec', goalType: 'COMPANY' },
      { id: 'obj-2', title: 'Team Goal', progress: 50, ownerEmail: 'lead@example.com', parentId: 'obj-1', teamName: 'Growth', goalType: 'TEAM' },
      { id: 'obj-3', title: 'Individual Goal', progress: 30, ownerEmail: 'ic@example.com', parentId: 'obj-2', teamName: 'Growth', goalType: 'INDIVIDUAL' },
    ])

    expect(nodes).toHaveLength(1)
    expect(nodes[0].children?.[0].title).toBe('Team Goal')
    expect(nodes[0].children?.[0].children?.[0].title).toBe('Individual Goal')
  })
})
