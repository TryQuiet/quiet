import { ExtendButtonBase } from '@mui/material'

export interface IIconProps {
  className?: string
  src: string | ExtendButtonBase
  onClickHandler?: () => void
  onMouseEnterHandler?: () => void
  onMouseLeaveHandler?: () => void
}
