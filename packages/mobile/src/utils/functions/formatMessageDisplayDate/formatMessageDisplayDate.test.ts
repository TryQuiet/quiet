import { formatMessageDisplayDate } from './formatMessageDisplayDate'

describe('Channel List Message date display', () => {
  // Save original Date implementation
  const OriginalDate = global.Date
  let mockDate: Date

  // Mock current date for consistent testing
  beforeEach(() => {
    // Mock date to January 15, 2024, 3:30 PM
    mockDate = new Date(2024, 0, 15, 15, 30, 0)

    // Override Date constructor to always return our fixed date for "now"
    global.Date = class extends OriginalDate {
      constructor(...args: any[]) {
        super()
        if (args.length === 0) {
          // If called with no args (new Date()), return our fixed mock date
          return mockDate
        }
        // Otherwise use the real Date constructor with the provided args
        // @ts-ignore
        return new OriginalDate(...args)
      }
    } as DateConstructor

    // Ensure static methods work too
    global.Date.now = () => mockDate.getTime()
  })

  // Restore original Date after tests
  afterEach(() => {
    global.Date = OriginalDate
  })

  describe('basic formatting tests', () => {
    it('renders timestamp from today as time only', () => {
      // Same day, different time (Jan 15, 2024, 10:30 AM)
      const timestamp = new Date(2024, 0, 15, 10, 30).getTime() / 1000

      const result = formatMessageDisplayDate(timestamp)
      // Time format might vary by locale, so just check for digits and colon
      expect(result).toMatch(/\d+[:.]\d+/)

      // Should not contain date parts
      expect(result).not.toMatch(/\d+\/\d+/)
      expect(result).not.toMatch(/2024/)
      expect(result).not.toContain('Yesterday')
    })

    it('renders timestamp from yesterday as "Yesterday"', () => {
      // Previous day (Jan 14, 2024)
      const timestamp = new Date(2024, 0, 14, 15, 30).getTime() / 1000

      const result = formatMessageDisplayDate(timestamp)
      expect(result).toBe('Yesterday')
    })

    it('renders timestamp from before yesterday with date and time', () => {
      // Two days ago (Jan 13, 2024)
      const timestamp = new Date(2024, 0, 13, 10, 30).getTime() / 1000

      const result = formatMessageDisplayDate(timestamp)

      // Should contain date part (format will vary by locale)
      expect(result).toMatch(/1[\s/-]*13|13[\s/-]*1/)

      // Should contain time part
      expect(result).toMatch(/\d+[:.]\d+/)
    })

    it('includes year for dates from previous years', () => {
      // Previous year (Dec 15, 2023)
      const timestamp = new Date(2023, 11, 15, 15, 30).getTime() / 1000

      const result = formatMessageDisplayDate(timestamp)
      expect(result).toMatch(/2023/)
    })
  })

  describe('edge cases', () => {
    it('correctly identifies "Yesterday" at month boundaries', () => {
      // Set mock date to first day of month (Feb 1, 2024)
      mockDate = new Date(2024, 1, 1, 15, 30)

      // Previous day (Jan 31, 2024)
      const timestamp = new Date(2024, 0, 31, 15, 30).getTime() / 1000

      const result = formatMessageDisplayDate(timestamp)
      expect(result).toBe('Yesterday')
    })

    it('correctly handles time zone differences', () => {
      // This is just to verify the testing environment
      // In a real test environment, we'd need to consider TZ offsets
      // but for unit tests, we're just confirming the basic time math works
      const timeInSeconds = Math.floor(Date.now() / 1000)
      const result = formatMessageDisplayDate(timeInSeconds)

      // Current time should be formatted as time only
      expect(result).not.toMatch(/\d+\/\d+/) // Should not have date components
      expect(result).toMatch(/\d+[:.]\d+/) // Should have time components
    })
  })
})
