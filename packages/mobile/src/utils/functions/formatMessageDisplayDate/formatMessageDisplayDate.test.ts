import { DateTime } from 'luxon'

import { formatMessageDisplayDate } from './formatMessageDisplayDate'

describe('Channel List Message date display', () => {
  it('timestamp in the current day is rendered as a localized time', () => {
    const messageDateTime = DateTime.now().toSeconds() - 1
    const formattedMessageDate = formatMessageDisplayDate(messageDateTime)
    expect(formattedMessageDate).toEqual(DateTime.fromSeconds(messageDateTime).toLocaleString(DateTime.TIME_SIMPLE))
  })
  it('timestamp in the previous day is rendered as Yesterday', () => {
    const messageDateTime = DateTime.now().minus({ days: 1 }).toSeconds()
    const formattedMessageDate = formatMessageDisplayDate(messageDateTime)
    expect(formattedMessageDate).toEqual('Yesterday')
  })
  it('timestamp before the previous day is rendered as a localized date and time', () => {
    const messageDateTime = DateTime.now().minus({ days: 2 }).toSeconds()
    const formattedMessageDate = formatMessageDisplayDate(messageDateTime)
    expect(formattedMessageDate).toEqual(DateTime.fromSeconds(messageDateTime).toLocaleString())
  })
})
