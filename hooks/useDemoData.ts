import { useMemo } from 'react'
import { startOfQuarter, endOfQuarter, subDays, subWeeks } from 'date-fns'
import type { Objective } from '@/hooks/useObjectives'
import type { CheckInSummary } from '@/lib/checkin-summary'
import type { DemoRole } from '@/components/demo/DemoContext'

// --- Static Data Definitions (Templates) ---

const USERS = {
    ADMIN: { id: 'u-ceo', name: 'Avery CEO', email: 'avery@okrflow.demo', role: 'ADMIN' },
    MANAGER: { id: 'u-vp-eng', name: 'David Eng', email: 'david@okrflow.demo', role: 'MANAGER' },
    EMPLOYEE: { id: 'u-ic-pm', name: 'Alex PM', email: 'alex@okrflow.demo', role: 'EMPLOYEE' },
} as const

const TEAMS = [
    { id: 't-exec', name: 'Executive', members: [USERS.ADMIN] },
    { id: 't-eng', name: 'Engineering', members: [USERS.MANAGER] },
    { id: 't-product', name: 'Product', members: [USERS.EMPLOYEE] },
]

export function useDemoData(role: DemoRole) {
    const now = new Date()
    const qStart = startOfQuarter(now).toISOString()
    const qEnd = endOfQuarter(now).toISOString()
    const qLabel = `Q${Math.floor((now.getMonth() + 3) / 3)} ${now.getFullYear()}`

    return useMemo(() => {
        // 1. Generate Objectives
        const objCompany = {
            id: 'o-c-1',
            title: 'Achieve $10M ARR Milestone',
            description: 'Scale revenue through new market expansion.',
            cycle: qLabel,
            startAt: qStart,
            endAt: qEnd,
            goalType: 'COMPANY',
            progressType: 'AUTOMATIC',
            progress: 72,
            status: 'IN_PROGRESS',
            score: 0.72,
            owner: USERS.ADMIN,
            team: TEAMS[0],
            fiscalQuarter: Math.floor((now.getMonth() + 3) / 3),
            createdAt: qStart,
            keyResults: [
                { id: 'kr-c-1', title: 'Reach $10M ARR', weight: 40, target: 10000000, current: 8500000, unit: 'USD', progress: 85, initiativeCount: 2 },
                { id: 'kr-c-2', title: 'New Market Expansion', weight: 30, target: 1000000, current: 450000, unit: 'USD', progress: 45, initiativeCount: 3 },
            ],
            children: [] as any[],
        }

        const objTeam = {
            id: 'o-t-1',
            title: 'Scale Infrastructure 10x',
            description: 'Prepare platform for enterprise load.',
            cycle: qLabel,
            startAt: qStart,
            endAt: qEnd,
            goalType: 'TEAM',
            progressType: 'AUTOMATIC',
            progress: 88,
            status: 'IN_PROGRESS',
            score: 0.88,
            owner: USERS.MANAGER,
            team: TEAMS[1],
            parent: { id: objCompany.id, title: objCompany.title },
            fiscalQuarter: Math.floor((now.getMonth() + 3) / 3),
            createdAt: qStart,
            keyResults: [
                { id: 'kr-t-1', title: '99.99% Uptime', weight: 100, target: 99.99, current: 99.95, unit: '%', progress: 99, initiativeCount: 1 },
            ],
            children: [] as any[],
        }

        const objIndividual = {
            id: 'o-i-1',
            title: 'Launch Self-Serve Analytics',
            description: 'Empower users to build their own reports.',
            cycle: qLabel,
            startAt: qStart,
            endAt: qEnd,
            goalType: 'INDIVIDUAL',
            progressType: 'AUTOMATIC',
            progress: 30,
            status: 'AT_RISK',
            score: 0.3,
            owner: USERS.EMPLOYEE,
            team: TEAMS[2],
            parent: { id: objTeam.id, title: objTeam.title },
            fiscalQuarter: Math.floor((now.getMonth() + 3) / 3),
            createdAt: qStart,
            keyResults: [
                { id: 'kr-i-1', title: 'Beta Release', weight: 100, target: 1, current: 0.3, unit: 'state', progress: 30, initiativeCount: 2 },
            ],
            children: [] as any[],
        }

        // Linkage
        objCompany.children.push({ id: objTeam.id, title: objTeam.title })
        objTeam.children.push({ id: objIndividual.id, title: objIndividual.title })

        const allObjectives = [objCompany, objTeam, objIndividual] as Objective[]

        // 2. Generate Check-In Summary
        const summary: CheckInSummary = {
            hero: {
                avgProgress: 63,
                completionRate: 40,
                atRiskObjectives: 1,
                objectiveCount: 3,
                scoreAverage: 0.63,
            },
            weeklySummary: {
                onTrack: 2,
                atRisk: 1,
                offTrack: 0,
                dueThisWeek: 1,
            },
            teamHeatmap: [
                { teamId: 't-eng', teamName: 'Engineering', progress: 88, status: 'green', objectiveCount: 1, memberCount: 3 },
                { teamId: 't-product', teamName: 'Product', progress: 30, status: 'yellow', objectiveCount: 1, memberCount: 3 },
            ],
            heatmap: [
                {
                    keyResultId: 'kr-t-1',
                    keyResultTitle: '99.99% Uptime',
                    objectiveTitle: objTeam.title,
                    ownerName: USERS.MANAGER.name,
                    weeklyProgress: [
                        { value: 99.9, status: 'green', date: subWeeks(now, 1) },
                        { value: 99.95, status: 'green', date: now },
                    ]
                }
            ],
            alignment: [
                {
                    id: objCompany.id,
                    title: objCompany.title,
                    progress: objCompany.progress,
                    owner: objCompany.owner.name,
                    goalType: 'COMPANY',
                    children: [
                        {
                            id: objTeam.id,
                            title: objTeam.title,
                            progress: objTeam.progress,
                            owner: objTeam.owner.name,
                            goalType: 'TEAM',
                            children: [
                                { id: objIndividual.id, title: objIndividual.title, progress: objIndividual.progress, owner: objIndividual.owner.name, goalType: 'INDIVIDUAL' }
                            ]
                        }
                    ]
                }
            ],
            recentCheckIns: [
                {
                    id: 'ci-1',
                    keyResultId: 'kr-t-1',
                    keyResultTitle: '99.99% Uptime',
                    objectiveId: objTeam.id,
                    objectiveTitle: objTeam.title,
                    ownerName: USERS.MANAGER.name,
                    ownerEmail: USERS.MANAGER.email,
                    status: 'GREEN',
                    value: 99.95,
                    comment: 'Stable week, no outages.',
                    weekStart: subDays(now, 2),
                }
            ]
        }

        return { objectives: allObjectives, summary }
    }, [role, qLabel, qStart, qEnd])
}
