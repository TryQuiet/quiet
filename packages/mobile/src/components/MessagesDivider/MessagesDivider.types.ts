export interface MessagesDividerProps {
  /**
   * Provide a formatted title string directly
   * Only required if timestamp is not provided
   */
  title?: string
  /**
   * Timestamp (seconds since epoch) to format using the standard date formatter
   * When provided, the title prop is ignored and formatting is handled internally
   */
  timestamp?: number
  /**
   * Whether this is a sticky date marker (floating at top of screen)
   */
  isSticky?: boolean
}
