import { TextStyle } from 'react-native'

export interface ContextMenuProps {
  visible: boolean
  handleClose: () => void
  title: string
  items: ContextMenuItemProps[]
  hint?: string
  link?: string
  linkAction?: () => void
  style?: TextStyle
  unregisteredUsername?: boolean
  username?: string
}

export interface ContextMenuItemProps {
  title: string
  action: () => void
}

export type UnregisteredUsernameArgs = {
  username: string
}
