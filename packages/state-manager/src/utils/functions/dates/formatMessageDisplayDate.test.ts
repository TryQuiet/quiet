import { DateTime } from 'luxon'
import { formatMessageDisplayDate } from './formatMessageDisplayDate'

describe('Format message display date', () => {
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

  it('shows "Today" for messages from today', () => {
    const createdAt = DateTime.now().toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Today')
  })

  it('shows "Yesterday" for messages from yesterday', () => {
    const createdAt = DateTime.now().minus({ days: 1 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Yesterday')
  })

  it('shows day name "Wednesday" for messages from 2 days ago', () => {
    const createdAt = DateTime.now().minus({ days: 2 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Wednesday')
  })

  it('shows day name "Tuesday" for messages from 3 days ago', () => {
    const createdAt = DateTime.now().minus({ days: 3 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Tuesday')
  })

  it('shows day name "Monday" for messages from 4 days ago', () => {
    const createdAt = DateTime.now().minus({ days: 4 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Monday')
  })

  it('shows formatted date for messages from 5 days ago', () => {
    const createdAt = DateTime.now().minus({ days: 5 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Mar 10, 2024')
  })

  it('shows formatted date for messages from 6 days ago', () => {
    const createdAt = DateTime.now().minus({ days: 6 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Mar 9, 2024')
  })

  it('shows formatted date for messages from previous month', () => {
    const createdAt = DateTime.now().minus({ months: 1 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Feb 15, 2024')
  })

  it('shows formatted date for messages from previous year', () => {
    const createdAt = DateTime.now().minus({ years: 1 }).toSeconds()
    const result = formatMessageDisplayDate(createdAt)
    expect(result).toBe('Mar 15, 2023')
  })

  it('shows formatted date for specific historic date', () => {
    // March 5, 2004
    const specificDate = DateTime.fromObject({
      year: 2004,
      month: 3,
      day: 5,
      hour: 12,
    }).toSeconds()

    const result = formatMessageDisplayDate(specificDate)
    expect(result).toBe('Mar 5, 2004')
  })

  it('falls back to English formatting when LC_ALL is not a valid locale', () => {
    const previousLocale = process.env.LC_ALL
    process.env.LC_ALL = 'C.UTF-8'

    try {
      const createdAt = DateTime.now().minus({ days: 2 }).toSeconds()
      const result = formatMessageDisplayDate(createdAt)
      expect(result).toBe('Wednesday')
    } finally {
      if (previousLocale === undefined) {
        delete process.env.LC_ALL
      } else {
        process.env.LC_ALL = previousLocale
      }
    }
  })
})
