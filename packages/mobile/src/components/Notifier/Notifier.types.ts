import { TextStyle } from 'react-native'

export interface NotifierProps {
  onButtonPress: () => void
  onEmailPress: () => void
  icon: any
  title: string
  message: string
  style?: TextStyle
}
