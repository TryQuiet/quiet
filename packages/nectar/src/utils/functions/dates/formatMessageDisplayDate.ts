import { DateTime } from 'luxon'

export const formatMessageDisplayDate = (createdAt: number): string => {
  const LC = process.env.LC_ALL || 'en_US.UTF-8'
  const locale = LC.split('_')[0]
  const now = DateTime.now().toSeconds()
  const diff = now - createdAt
  if (diff > 86400) {
    return DateTime.fromSeconds(createdAt).setLocale(locale).toFormat('LLL dd, t')
  }
  return DateTime.fromSeconds(createdAt).setLocale(locale).toFormat('t')
}
