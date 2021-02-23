import { PopperProps } from '@material-ui/core/Popper'

export interface IPopupMenuProps {
  open: boolean
  anchorEl?: PopperProps['anchorEl']
  className?: string
  placement?: PopperProps['placement']
  offset?: string | number
}
