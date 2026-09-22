import { TextStyle, type ColorValue } from 'react-native'
import { useContextMenu } from '../../hooks/useContextMenu'
import { FontWeight, type TypographyProps } from '../Typography/Typography.types'
import { FC } from 'react'
import type { defaultTheme } from '../../styles/themes/default.theme'
import type { defaultPalette } from '../../styles/palettes/default.palette'

export interface AppbarProps {
  /** Bar title; not rendered with `withoutTitle`. */
  title?: string
  titleComponent?: React.JSX.Element
  prefix?: string
  position?: 'flex-start' | 'center'
  style?: TextStyle
  back?: () => void
  submit?: () => void
  contextMenu?: ReturnType<typeof useContextMenu> | null
  crossBackIcon?: boolean
  /**
   * What the glyph does, for assistive tech. Defaults to the icon's own name
   * ("Close" for the cross, "Go back" for the arrow) — pass it where the two
   * differ, as on Want a server? (2922:10009), whose × goes back.
   */
  backAccessibilityLabel?: string
  iconColor?: string
  textColor?: keyof typeof defaultPalette['typography']
  /** No back arrow and no community tile on the left (onboarding roots). */
  plain?: boolean
  /**
   * The bar zone (60, the library's Title bar) with the back/close glyph at its
   * designed place and nothing else: no title text, no hairline. The full-screen
   * h1 stages of the onboarding — the prototype hides their bar title and the
   * heading is the title (ONBOARDING.md, "No top bar title on full-screen h1
   * stages"); titled bars remain on sheets and the community home.
   */
  withoutTitle?: boolean
}

export interface HeaderTitleProps {
  title: string
  fontSize?: number
  fontWeight?: FontWeight
  textColor?: keyof typeof defaultPalette['typography']
}
