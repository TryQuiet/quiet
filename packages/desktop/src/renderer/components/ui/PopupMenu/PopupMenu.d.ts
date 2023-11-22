import { PopperProps } from '@mui/material/Popper'

export interface IPopupMenuProps {
    open: boolean
    anchorEl?: RefObject<unknown>
    className?: string
    placement?: PopperProps['placement']
    offset?: string | number
    children?: React.ReactNode
}
