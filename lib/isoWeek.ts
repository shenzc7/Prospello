export function currentWeekISO(referenceDate: Date = new Date()) {
  const date = new Date(Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()))

  // ISO week starts on Monday; adjust to nearest Thursday
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)

  const week = String(weekNumber).padStart(2, '0')
  return `${date.getUTCFullYear()}-W${week}`
}
