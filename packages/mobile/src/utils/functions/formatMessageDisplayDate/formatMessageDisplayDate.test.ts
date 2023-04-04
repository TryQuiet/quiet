import { formatMessageDisplayDate } from './formatMessageDisplayDate'

describe('Channel List Message date display', () => {
  const currentTime = 1680631544000 // Tuesday, April 4, 2023 11:05:44 AM GMT-07:00 DST
  it('timestamp in the current day is rendered as a localized time', () => {
    const messageDate = formatMessageDisplayDate(1680609944, currentTime) // Tuesday, April 4, 2023 5:05:44 AM GMT-07:00 DST
    expect(messageDate).toEqual('5:05 AM')
  })
  it('timestamp in the previous day is rendered as Yeseterday', () => {
    const messageDate = formatMessageDisplayDate(1680523544, currentTime) // Monday, April 3, 2023 5:05:44 AM GMT-07:00 DST
    expect(messageDate).toEqual('Yesterday')
  })
  it('timestamp before the previous day is rendered as a localized date and time', () => {
    const messageDate = formatMessageDisplayDate(1680437144, currentTime) // Sunday, April 2, 2023 5:05:44 AM GMT-07:00 DST
    expect(messageDate).toEqual('4/2/2023')
  })
})
