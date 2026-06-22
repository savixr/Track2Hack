import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, differenceInCalendarDays, subDays } from 'date-fns'

export function calcStreak(entryDates) {
  // entryDates: array of 'yyyy-MM-dd' strings, unique
  if (!entryDates.length) return 0
  const dateSet = new Set(entryDates)
  let streak = 0
  let cursor = new Date()

  // if no entry today, check if yesterday has one (streak still "alive")
  const today = format(cursor, 'yyyy-MM-dd')
  if (!dateSet.has(today)) {
    cursor = subDays(cursor, 1)
  }

  while (true) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (dateSet.has(key)) {
      streak++
      cursor = subDays(cursor, 1)
    } else {
      break
    }
  }
  return streak
}

export function currentWeekRange() {
  const now = new Date()
  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
}

export function currentMonthRange() {
  const now = new Date()
  return { start: startOfMonth(now), end: endOfMonth(now) }
}

export function fmtDate(dateStr, pattern = 'MMM d, yyyy') {
  return format(parseISO(dateStr), pattern)
}

export function daysAgo(dateStr) {
  return differenceInCalendarDays(new Date(), parseISO(dateStr))
}
