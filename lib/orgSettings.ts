import { localeConfig } from '@/config/locale'

export type OrgLocaleSettings = {
  fiscalYearStartMonth: number
  weekStart: 'monday' | 'sunday'
  scoringScale: 'percent' | 'fraction'
  numberLocale: string
  dateFormat: string
  highContrastStatus: boolean
  hierarchyLabels: {
    company: string
    department: string
    team: string
    individual: string
  }
}

export const defaultOrgLocaleSettings: OrgLocaleSettings = {
  fiscalYearStartMonth: localeConfig.fiscalYearStartMonth,
  weekStart: localeConfig.weekStart,
  scoringScale: localeConfig.scoringScale,
  numberLocale: localeConfig.numberLocale,
  dateFormat: localeConfig.dateFormat,
  highContrastStatus: localeConfig.highContrastStatus,
  hierarchyLabels: { ...localeConfig.hierarchyLabels },
}

export function mergeOrgSettings(stored?: unknown): OrgLocaleSettings {
  if (!stored || typeof stored !== 'object') return defaultOrgLocaleSettings
  const data = stored as Partial<OrgLocaleSettings>
  return {
    fiscalYearStartMonth: Number(data.fiscalYearStartMonth) || defaultOrgLocaleSettings.fiscalYearStartMonth,
    weekStart: (data.weekStart === 'sunday' ? 'sunday' : 'monday'),
    scoringScale: data.scoringScale === 'fraction' ? 'fraction' : 'percent',
    numberLocale: data.numberLocale || defaultOrgLocaleSettings.numberLocale,
    dateFormat: data.dateFormat || defaultOrgLocaleSettings.dateFormat,
    highContrastStatus:
      data.highContrastStatus === true || data.highContrastStatus === false
        ? data.highContrastStatus
        : defaultOrgLocaleSettings.highContrastStatus,
    hierarchyLabels: {
      company: data.hierarchyLabels?.company || defaultOrgLocaleSettings.hierarchyLabels.company,
      department: data.hierarchyLabels?.department || defaultOrgLocaleSettings.hierarchyLabels.department,
      team: data.hierarchyLabels?.team || defaultOrgLocaleSettings.hierarchyLabels.team,
      individual: data.hierarchyLabels?.individual || defaultOrgLocaleSettings.hierarchyLabels.individual,
    },
  }
}















