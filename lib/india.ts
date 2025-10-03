// Fiscal quarter calculations aligned with Indian business reporting standards.

const INDIAN_QUARTER_BOUNDS = [
  { startMonth: 3, endMonth: 5, value: 1 },
  { startMonth: 6, endMonth: 8, value: 2 },
  { startMonth: 9, endMonth: 11, value: 3 },
]

export function getIndianFiscalQuarter(date: Date): number {
  const probe = new Date(date)
  // Note: Currently uses UTC; will be enhanced for organization-specific timezones.
  const month = probe.getUTCMonth()

  for (const bound of INDIAN_QUARTER_BOUNDS) {
    if (month >= bound.startMonth && month <= bound.endMonth) {
      return bound.value
    }
  }

  return 4
}

export function getIndianFiscalLabel(quarter: number): string {
  switch (quarter) {
    case 1:
      return 'Q1 (Apr - Jun)'
    case 2:
      return 'Q2 (Jul - Sep)'
    case 3:
      return 'Q3 (Oct - Dec)'
    default:
      return 'Q4 (Jan - Mar)'
  }
}
