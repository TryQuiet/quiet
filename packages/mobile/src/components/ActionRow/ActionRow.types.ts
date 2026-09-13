import type { ReactElement } from 'react'

export interface ActionRowProps {
  icon: ReactElement
  label: string
  subtitle?: string
  onPress?: () => void
  disabled?: boolean
  testID?: string
}
