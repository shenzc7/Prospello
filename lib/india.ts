import { localeConfig } from '@/config/locale'

// Fiscal quarter calculations honoring org-configured start month (default April for India).

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildQuarterBounds(startMonth: number) {
  const startIndex = Math.max(1, Math.min(12, startMonth)) - 1 // clamp 1-12 to 0-11
  return Array.from({ length: 4 }, (_, idx) => {
    const start = (startIndex + idx * 3) % 12
    const end = (start + 2) % 12
    return { startMonth: start, endMonth: end, value: idx + 1 }
  })
}

export function getFiscalQuarter(date: Date, startMonth = localeConfig.fiscalYearStartMonth): number {
  const probe = new Date(date)
  const month = probe.getUTCMonth()
  const bounds = buildQuarterBounds(startMonth)

  for (const bound of bounds) {
    // Handles wrap-around when fiscal year starts mid-year.
    if (bound.startMonth <= bound.endMonth) {
      if (month >= bound.startMonth && month <= bound.endMonth) return bound.value
    } else {
      if (month >= bound.startMonth || month <= bound.endMonth) return bound.value
    }
  }

  return 1
}

// Legacy alias for backward compatibility
export const getIndianFiscalQuarter = getFiscalQuarter

export function getFiscalQuarterLabel(
  quarter: number,
  startMonth = localeConfig.fiscalYearStartMonth
): string {
  const bounds = buildQuarterBounds(startMonth)
  const match = bounds.find((b) => b.value === quarter) ?? bounds[0]
  const startName = monthNames[match.startMonth]
  const endName = monthNames[match.endMonth]
  return `Q${match.value} (${startName} - ${endName})`
}

// Legacy alias for backward compatibility
export const getIndianFiscalLabel = getFiscalQuarterLabel
