import { PopperProps } from '@material-ui/core/Popper'

export interface IPopupMenuProps {
  open: boolean
  anchorEl?: RefObject<unknown>
  className?: string
  placement?: PopperProps['placement']
  offset?: string | number
}
