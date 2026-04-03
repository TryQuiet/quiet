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
  contextMenu?: ReturnType<typeof useContextMenu> | null
  crossBackIcon?: boolean
}

export interface HeaderTitleProps {
  title: string
  fontSize?: number
  fontWeight?: FontWeight
}
