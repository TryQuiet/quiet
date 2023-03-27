
import { TextStyle } from 'react-native'

export interface ContextMenuProps {
  visible: boolean
  handleClose: () => void
  title: string
  items: ContextMenuItemProps[]
  style?: TextStyle
}

export interface ContextMenuItemProps {
  title: string
  action: () => void
}
