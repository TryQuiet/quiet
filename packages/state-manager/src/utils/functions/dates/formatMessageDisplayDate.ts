import { DateTime } from 'luxon'

const FALLBACK_LOCALE = 'en-US'

const getSystemLocale = (): string => {
  const locale = process.env.LC_ALL || process.env.LC_TIME || process.env.LANG || FALLBACK_LOCALE
  const normalizedLocale = locale.split('.')[0].replace('_', '-')

  try {
    return Intl.DateTimeFormat.supportedLocalesOf([normalizedLocale]).length > 0 ? normalizedLocale : FALLBACK_LOCALE
  } catch {
    return FALLBACK_LOCALE
  }
}

export const formatMessageDisplayDate = (createdAt: number): string => {
  // Extract timezone offset from native Date API
  const tzOffsetHours = -new Date().getTimezoneOffset() / 60
  const formattedOffset = `UTC${tzOffsetHours >= 0 ? '+' : ''}${tzOffsetHours}`

  const locale = getSystemLocale()
  const messageDate = DateTime.fromSeconds(createdAt).setZone(formattedOffset).setLocale(locale)
  const now = DateTime.now().setZone(formattedOffset).setLocale(locale)
  const diffInDays = now.startOf('day').diff(messageDate.startOf('day'), 'days').days

  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays >= 2 && diffInDays <= 4) {
    return messageDate.toFormat('cccc') // Full weekday name
  } else {
    return messageDate.toFormat('LLL d, y')
  }
}
