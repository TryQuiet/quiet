import { DateTime } from 'luxon'

import { formatMessageDisplayDate } from './formatMessageDisplayDate'

describe('Channel List Message date display', () => {
  it('timestamp in the current day is rendered as a localized time', () => {
    const messageDateTime = Date.now() / 1000 - 21600 // Minus 6 hours
    const formattedMessageDate = formatMessageDisplayDate(messageDateTime)
    expect(formattedMessageDate).toEqual(DateTime.fromSeconds(messageDateTime).toLocaleString(DateTime.TIME_SIMPLE))
  })
  it('timestamp in the previous day is rendered as Yeseterday', () => {
    const messageDateTime = Date.now() / 1000 - 108000 // Minus 30 hours
    const formattedMessageDate = formatMessageDisplayDate(messageDateTime)
    expect(formattedMessageDate).toEqual('Yesterday')
  })
  it('timestamp before the previous day is rendered as a localized date and time', () => {
    const messageDateTime = Date.now() / 1000 - 194400 // Minus 54 hours
    const formattedMessageDate = formatMessageDisplayDate(messageDateTime)
    expect(formattedMessageDate).toEqual(DateTime.fromSeconds(messageDateTime).toLocaleString())
  })
})
