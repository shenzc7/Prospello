// India-first defaults with global-friendly overrides via env.
// These values are read client- and server-side, so keep them serializable.

type WeekStart = 'monday' | 'sunday'
type ScoringScale = 'percent' | 'fraction' // percent = 0-100, fraction = 0-1

const parseMonth = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  if (parsed < 1 || parsed > 12) return fallback
  return parsed
}

export const localeConfig = {
  // Default to India fiscal (Apr start) but allow override.
  fiscalYearStartMonth: parseMonth(process.env.NEXT_PUBLIC_FISCAL_YEAR_START_MONTH, 4),
  weekStart: (process.env.NEXT_PUBLIC_WEEK_START_DAY?.toLowerCase() as WeekStart) || 'monday',
  scoringScale: (process.env.NEXT_PUBLIC_SCORING_SCALE?.toLowerCase() as ScoringScale) || 'percent',
  numberLocale: process.env.NEXT_PUBLIC_NUMBER_LOCALE || 'en-IN',
  dateFormat: process.env.NEXT_PUBLIC_DATE_FORMAT || 'dd-mm-yyyy',
  highContrastStatus: process.env.NEXT_PUBLIC_HIGH_CONTRAST_STATUS === 'true',
  hierarchyLabels: {
    company: process.env.NEXT_PUBLIC_LABEL_COMPANY || 'Company',
    department: process.env.NEXT_PUBLIC_LABEL_DEPARTMENT || 'Department',
    team: process.env.NEXT_PUBLIC_LABEL_TEAM || 'Team',
    individual: process.env.NEXT_PUBLIC_LABEL_INDIVIDUAL || 'Individual',
  },
}

export type LocaleConfig = typeof localeConfig














