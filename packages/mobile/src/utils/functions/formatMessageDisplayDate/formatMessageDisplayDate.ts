import { DateTime } from 'luxon'
import {
  formatMessageDisplayDate as stateManagerFormatDate,
  formatMessageDisplayDay,
} from '@quiet/state-manager/src/utils/functions/dates/formatMessageDisplayDate'

// Re-export the state-manager functions to maintain consistency across platforms
export { formatMessageDisplayDay } from '@quiet/state-manager/src/utils/functions/dates/formatMessageDisplayDate'

export const formatMessageDisplayDate = stateManagerFormatDate

// Helper function to extract just the time from a formatted date
export const formatMessageTime = (createdAt: number): string => {
  return DateTime.fromSeconds(createdAt).toFormat('t')
}
