
import { TextStyle } from 'react-native'

export interface ContextMenuProps {
  visible: boolean
  handleClose: () => void
  title: string
  items: ContextMenuItemProps[]
  hint?: string
  link?: string
  style?: TextStyle
}

export interface ContextMenuItemProps {
  title: string
  action: () => void
}
