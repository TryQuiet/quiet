
import { TextStyle } from 'react-native'

export interface AppbarProps {
  title: string
  prefix?: string
  position?: 'flex-start' | 'center'
  style?: TextStyle
  back?: () => void
  hasContextMenu?: boolean
}
