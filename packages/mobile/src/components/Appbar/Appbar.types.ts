import { TextStyle } from 'react-native'
import { useContextMenu } from '../../hooks/useContextMenu'

export interface AppbarProps {
  title: string
  prefix?: string
  position?: 'flex-start' | 'center'
  style?: TextStyle
  back?: () => void
  contextMenu?: ReturnType<typeof useContextMenu> | null
}
