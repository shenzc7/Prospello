// Fiscal quarter calculations for standard business reporting.

const FISCAL_QUARTER_BOUNDS = [
  { startMonth: 0, endMonth: 2, value: 1 },
  { startMonth: 3, endMonth: 5, value: 2 },
  { startMonth: 6, endMonth: 8, value: 3 },
  { startMonth: 9, endMonth: 11, value: 4 },
]

export function getFiscalQuarter(date: Date): number {
  const probe = new Date(date)
  // Note: Currently uses UTC; will be enhanced for organization-specific timezones.
  const month = probe.getUTCMonth()

  for (const bound of FISCAL_QUARTER_BOUNDS) {
    if (month >= bound.startMonth && month <= bound.endMonth) {
      return bound.value
    }
  }

  return 1
}

// Legacy alias for backward compatibility
export const getIndianFiscalQuarter = getFiscalQuarter

export function getFiscalQuarterLabel(quarter: number): string {
  switch (quarter) {
    case 1:
      return 'Q1 (Jan - Mar)'
    case 2:
      return 'Q2 (Apr - Jun)'
    case 3:
      return 'Q3 (Jul - Sep)'
    case 4:
      return 'Q4 (Oct - Dec)'
    default:
      return 'Q1 (Jan - Mar)'
  }
}

// Legacy alias for backward compatibility
export const getIndianFiscalLabel = getFiscalQuarterLabel
