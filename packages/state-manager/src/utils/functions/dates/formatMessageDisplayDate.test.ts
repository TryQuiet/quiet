import { DateTime } from 'luxon'
import { formatMessageDisplayDate } from './formatMessageDisplayDate'

describe('Format message displays date', () => {
  beforeEach(() => {
    // Mock current date to 2024-03-15 (Friday)
    jest.spyOn(DateTime, 'now').mockImplementation(() =>
      DateTime.fromObject({
        year: 2024,
        month: 3,
        day: 15,
        hour: 12,
      })
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows full date for messages more than 4 days old', () => {
    const createdAt = DateTime.now().plus({ days: -5 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Mar 10, 2024')
  })

  it('shows "Today" for current day messages', () => {
    const createdAt = DateTime.now().toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Today')
  })

  it('shows "Yesterday" for previous day messages', () => {
    const createdAt = DateTime.now().plus({ days: -1 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Yesterday')
  })

  it('shows weekday name for 2 days ago', () => {
    const createdAt = DateTime.now().plus({ days: -2 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Wednesday')
  })

  it('shows weekday name for 3 days ago', () => {
    const createdAt = DateTime.now().plus({ days: -3 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Tuesday')
  })

  it('shows weekday name for 4 days ago', () => {
    const createdAt = DateTime.now().plus({ days: -4 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Monday')
  })

  it('shows full date for messages from previous years', () => {
    const createdAt = DateTime.now().plus({ years: -1 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Mar 15, 2023')
  })
})
