import React, { ReactElement, ReactFragment } from 'react'
import { styled, Theme } from '@mui/material/styles'
import classNames from 'classnames'

import MuiTooltip, { TooltipProps } from '@mui/material/Tooltip'

// Styling mui tooltip requires workaround: https://mui.com/material-ui/guides/interoperability/#portals
const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
), {})(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    marginBottom: 5,
    background: theme.palette.colors.trueBlack,
    color: theme.typography.body1.color,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,

    '&:first-letter': {
      textTransform: 'capitalize',
    }
  },
  '& .MuiTooltip-arrow': {
    '&:before': {
      border: `1px solid ${theme.palette.colors.trueBlack}`
    },
    color: theme.palette.colors.trueBlack
  }
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
        title={
          title.length === 0 ? (
            ''
          ) : (
            <React.Fragment>
              {titleHTML || (
                <span>{title}</span>
              )}
            </React.Fragment>
          )
        }
        placement={placement}
        arrow
        >
        {children}
      </StyledTooltip>
    </span>
  )
}

export default Tooltip
