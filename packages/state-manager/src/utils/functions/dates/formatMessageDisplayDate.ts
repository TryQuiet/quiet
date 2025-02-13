import { DateTime } from 'luxon'

export const formatMessageDisplayDate = (createdAt: number): string => {
  const LC = process.env.LC_ALL || 'en_US.UTF-8'
  const locale = LC.split('_')[0]
  const messageDate = DateTime.fromSeconds(createdAt).setLocale(locale)
  const now = DateTime.now().setLocale(locale)

  const diffInDays = now.startOf('day').diff(messageDate.startOf('day'), 'days').days

  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays > 1 && diffInDays <= 4) {
    return messageDate.toFormat('cccc') // Full weekday name
  } else {
    return messageDate.toFormat('LLL d, y')
  }
}
