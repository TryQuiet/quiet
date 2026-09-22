import React, { ReactElement, ReactFragment } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'

import MuiTooltip, { TooltipProps } from '@mui/material/Tooltip'

// The tooltip's look (ink fill, radius 8, 8/16 padding, 14/20 white text) is the
// theme's MuiTooltip override, from the library's Tooltip-content (3490:10102).
// Styling mui tooltip requires workaround: https://mui.com/material-ui/guides/interoperability/#portals
const StyledTooltip = styled(
  ({ className, ...props }: TooltipProps) => <MuiTooltip {...props} classes={{ popper: className }} />,
  {}
)(() => ({
  '& .MuiTooltip-tooltip': {
    '&:first-letter': {
      textTransform: 'capitalize',
    },
  },
}))

interface CustomTooltipProps {
  children: ReactElement
  title?: string
  titleHTML?: ReactFragment
  interactive?: boolean
  className?: string
  placement?: 'bottom' | 'top' | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  onClick?: (e: React.MouseEvent) => void
}

export const Tooltip: React.FC<React.ComponentProps<typeof MuiTooltip> & CustomTooltipProps> = ({
  children,
  title,
  titleHTML,
  interactive = false,
  className = '',
  placement = 'bottom',
  onClick = () => {},
  ...props
}) => {
  return (
    <span onClick={e => onClick(e)}>
      <StyledTooltip
        {...props}
        className={className}
        title={title?.length === 0 ? '' : <React.Fragment>{titleHTML || <span>{title}</span>}</React.Fragment>}
        placement={placement}
        arrow
      >
        {children}
      </StyledTooltip>
    </span>
  )
}

export default Tooltip
