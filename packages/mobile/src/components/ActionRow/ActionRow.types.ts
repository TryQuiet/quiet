import type { ReactElement } from 'react'

export interface ActionRowProps {
  icon: ReactElement
  label: string
  subtitle?: string
  onPress?: () => void
  disabled?: boolean
  /** The hairline under the row; off for the last row of a bordered group. */
  divider?: boolean
  testID?: string
}
