import { TextStyle, type ColorValue } from 'react-native'
import { useContextMenu } from '../../hooks/useContextMenu'
import { FontWeight, type TypographyProps } from '../Typography/Typography.types'
import { FC } from 'react'
import type { defaultTheme } from '../../styles/themes/default.theme'
import type { defaultPalette } from '../../styles/palettes/default.palette'

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
  iconColor?: string
  textColor?: keyof typeof defaultPalette['typography']
}

export interface HeaderTitleProps {
  title: string
  fontSize?: number
  fontWeight?: FontWeight
  textColor?: keyof typeof defaultPalette['typography']
}
