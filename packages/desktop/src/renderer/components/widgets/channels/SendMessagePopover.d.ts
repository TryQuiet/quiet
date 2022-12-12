import { ModalProps } from '@mui/material/Modal'
import { PopoverProps } from '@mui/material/Popover'
import { History, LocationState } from 'history'

export interface ISendMessagePopoverProps {
  username?: string
  handleClose?: ModalProps['onClose']
  address?: string
  anchorEl?: PopoverProps['anchorEl']
  isUnregistered?: boolean
  createNewContact?: (contact: any) => void
  history?: History<LocationState>
  users?: object
  message?: any
}
