import { TextStyle } from 'react-native'
import { useContextMenu } from '../../hooks/useContextMenu'
import { FontWeight } from '../Typography/Typography.types'
import { FC } from 'react'

export interface AppbarProps {
  title: string
  titleComponent?: React.JSX.Element
  prefix?: string
  position?: 'flex-start' | 'center'
  style?: TextStyle
  back?: () => void
  submit?: () => void
  contextMenu?: ReturnType<typeof useContextMenu> | null
  crossBackIcon?: boolean
  /** No back arrow and no community tile on the left (onboarding roots). */
  plain?: boolean
  /**
   * A full-screen h1 stage (the prototype hides the bar's title on screens with a large
   * heading): the glyph alone, no title text and no divider — the h1 is the title. Sheets
   * keep their titled bar.
   */
  bare?: boolean
}

export interface HeaderTitleProps {
  title: string
  fontSize?: number
  fontWeight?: FontWeight
}
