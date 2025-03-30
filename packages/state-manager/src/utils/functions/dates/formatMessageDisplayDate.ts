import { DateTime } from 'luxon'

export const formatMessageDisplayDate = (createdAt: number): string => {
  // Extract timezone offset from native Date API
  const tzOffsetHours = -new Date().getTimezoneOffset() / 60
  const formattedOffset = `UTC${tzOffsetHours >= 0 ? '+' : ''}${tzOffsetHours}`

  const LC = process.env.LC_ALL || 'en_US.UTF-8'
  const locale = LC.split('_')[0]
  const messageDate = DateTime.fromSeconds(createdAt).setZone(formattedOffset).setLocale(locale)
  const now = DateTime.now().setZone(formattedOffset).setLocale(locale)
  const check = messageDate.hasSame(now, 'year') && messageDate.hasSame(now, 'day')
  if (!check) {
    return DateTime.fromSeconds(createdAt).setZone(formattedOffset).setLocale(locale).toFormat('LLL d, t')
  }
  return DateTime.fromSeconds(createdAt).setZone(formattedOffset).setLocale(locale).toFormat('t')
}

export const formatMessageDisplayDay = (date: string): string => {
  if (date.includes(',')) {
    return date.split(',')[0]
  }
  return 'Today'
}
