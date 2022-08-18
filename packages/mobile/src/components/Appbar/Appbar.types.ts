
import { TextStyle } from 'react-native'

export interface AppbarProps {
  title: string
  style?: TextStyle
  back?: () => void
}
