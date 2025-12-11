import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { localeConfig } from '@/config/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const percentFormatter = new Intl.NumberFormat(localeConfig.numberLocale, {
  style: 'percent',
  maximumFractionDigits: 0,
})

const inrFormatter = new Intl.NumberFormat(localeConfig.numberLocale, {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const metricFormatter = new Intl.NumberFormat(localeConfig.numberLocale, {
  maximumFractionDigits: 2,
})

const currencyUnitRegex = /(₹|inr|rupee)/i

export function fmtPercent(value: number | null | undefined, options?: Intl.NumberFormatOptions) {
  if (value == null || !Number.isFinite(value)) {
    return '–'
  }
  const formatter = options
    ? new Intl.NumberFormat(localeConfig.numberLocale, { style: 'percent', maximumFractionDigits: 0, ...options })
    : percentFormatter
  return formatter.format(value / 100)
}

export function fmtINRCurrency(value: number | null | undefined, options?: Intl.NumberFormatOptions) {
  if (value == null || !Number.isFinite(value)) {
    return '₹0'
  }
  const formatter = options
    ? new Intl.NumberFormat(localeConfig.numberLocale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0, ...options })
    : inrFormatter
  return formatter.format(value)
}

export function fmtMetric(value: number | null | undefined, unit?: string | null, options?: Intl.NumberFormatOptions) {
  if (value == null || !Number.isFinite(value)) {
    return '–'
  }
  if (unit && currencyUnitRegex.test(unit)) {
    return fmtINRCurrency(value, options)
  }
  const formatter = options
    ? new Intl.NumberFormat(localeConfig.numberLocale, { maximumFractionDigits: 2, ...options })
    : metricFormatter
  return formatter.format(value)
}

/**
 * Progress formatting that shows dual notation when needed (e.g., 70% • 0.70).
 * Honors org scoring scale (percent vs fraction).
 */
export function fmtProgressDual(
  value: number | null | undefined,
  opts: { dual?: boolean; fractionDigits?: number } = {}
) {
  const { dual = true, fractionDigits = 2 } = opts
  if (value == null || !Number.isFinite(value)) return '–'

  const percent = fmtPercent(value)
  if (!dual) return percent

  const fraction = (value / 100).toFixed(fractionDigits)
  const prefersFraction = localeConfig.scoringScale === 'fraction'

  return prefersFraction ? `${fraction} • ${percent}` : `${percent} • ${fraction}`
}
