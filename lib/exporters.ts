import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { Role } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { calculateKRProgress } from '@/lib/utils'
import { calcProgressFromProgress } from '@/lib/okr'
import { mergeOrgSettings, type OrgLocaleSettings, defaultOrgLocaleSettings } from '@/lib/orgSettings'

export type ObjectiveExportRow = {
  id: string
  title: string
  owner: string
  team?: string | null
  cycle: string
  status: string
  progress: number
  keyResults: Array<{
    title: string
    progress: number
    weight: number
  }>
}

export type ExportMeta = {
  orgName: string
  settings: OrgLocaleSettings
  timezone: string
}

function scopeWhere(scope: string, userId: string, role: Role) {
  if (scope === 'personal' || role === Role.EMPLOYEE) {
    return { ownerId: userId }
  }
  return {}
}

export async function getObjectivesForExport(scope: string, userId: string, role: Role, orgId: string): Promise<ObjectiveExportRow[]> {
  const objectives = await prisma.objective.findMany({
    where: {
      ...scopeWhere(scope, userId, role),
      owner: { orgId },
    },
    include: {
      owner: { select: { name: true, email: true } },
      team: { select: { name: true } },
      keyResults: {
        select: { id: true, title: true, weight: true, current: true, target: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 300,
  })

  return objectives.map((objective) => {
    const keyResults = objective.keyResults.map((kr) => ({
      title: kr.title,
      weight: kr.weight,
      progress: calculateKRProgress(kr.current, kr.target),
    }))

    const progress = calcProgressFromProgress(keyResults.map((kr) => ({ progress: kr.progress, weight: kr.weight })))

    return {
      id: objective.id,
      title: objective.title,
      owner: objective.owner.name || objective.owner.email,
      team: objective.team?.name,
      cycle: objective.cycle,
      status: objective.status,
      progress,
      keyResults,
    }
  })
}

function formatPercent(value: number, locale: string) {
  const formatter = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  return formatter.format(value / 100)
}

function formatDateTime(locale: string, timezone: string) {
  const fmt = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  })
  return fmt.format(new Date())
}

export function buildPdf(rows: ObjectiveExportRow[], meta?: Partial<ExportMeta>): Buffer {
  const effectiveMeta: ExportMeta = {
    orgName: meta?.orgName || 'Organization',
    settings: meta?.settings ? mergeOrgSettings(meta.settings) : defaultOrgLocaleSettings,
    timezone: meta?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  }

  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(`${effectiveMeta.orgName} — OKR Report`, 14, 16)
  doc.setFontSize(10)
  doc.text(
    `Fiscal start: ${effectiveMeta.settings.fiscalYearStartMonth} • Locale: ${effectiveMeta.settings.numberLocale} • TZ: ${effectiveMeta.timezone}`,
    14,
    22
  )
  doc.text(`Generated: ${formatDateTime(effectiveMeta.settings.numberLocale, effectiveMeta.timezone)}`, 14, 28)
  let y = 36

  rows.forEach((row, idx) => {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    doc.text(`${idx + 1}. ${row.title}`, 14, y)
    y += 6
    doc.text(`Owner: ${row.owner} • Team: ${row.team || 'N/A'} • Cycle: ${row.cycle}`, 14, y)
    y += 5
    doc.text(
      `Status: ${row.status} • Progress: ${formatPercent(row.progress, effectiveMeta.settings.numberLocale)}`,
      14,
      y
    )
    y += 5
    doc.text('Key Results:', 14, y)
    y += 5
    row.keyResults.forEach((kr) => {
      doc.text(
        `- ${kr.title} (${kr.weight}%): ${formatPercent(kr.progress, effectiveMeta.settings.numberLocale)}`,
        18,
        y
      )
      y += 5
    })
    y += 4
  })

  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}

export function buildExcel(rows: ObjectiveExportRow[], meta?: Partial<ExportMeta>): Buffer {
  const effectiveMeta: ExportMeta = {
    orgName: meta?.orgName || 'Organization',
    settings: meta?.settings ? mergeOrgSettings(meta.settings) : defaultOrgLocaleSettings,
    timezone: meta?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  }

  const percentFmt = (value: number) => formatPercent(value, effectiveMeta.settings.numberLocale)

  const sheetRows = rows.map((row) => ({
    Objective: row.title,
    Owner: row.owner,
    Team: row.team ?? '',
    Cycle: row.cycle,
    Status: row.status,
    Progress: percentFmt(row.progress),
    KeyResults: row.keyResults
      .map((kr) => `${kr.title} (${kr.weight}% • ${percentFmt(kr.progress)})`)
      .join('; '),
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(sheetRows)
  XLSX.utils.sheet_add_aoa(
    ws,
    [
      [`Org: ${effectiveMeta.orgName}`],
      [
        `Fiscal start: ${effectiveMeta.settings.fiscalYearStartMonth}`,
        `Locale: ${effectiveMeta.settings.numberLocale}`,
        `TZ: ${effectiveMeta.timezone}`,
        `Generated: ${formatDateTime(effectiveMeta.settings.numberLocale, effectiveMeta.timezone)}`,
      ],
      [],
    ],
    { origin: 'A1' }
  )
  XLSX.utils.book_append_sheet(wb, ws, 'OKRs')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.from(buffer)
}
