import { ExtendButtonBase } from '@material-ui/core'

export interface IIconProps {
  className?: string
  src: string | ExtendButtonBase
  onClickHandler?: () => void
  onMouseEnterHandler?: () => void
  onMouseLeaveHandler?: () => void
}
