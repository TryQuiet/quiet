import React, { ReactElement, ReactFragment, useState } from 'react'
import classNames from 'classnames'

import MuiTooltip from '@material-ui/core/Tooltip'
import { makeStyles, Theme } from '@material-ui/core/styles'

function arrowGenerator(color: string, theme: Theme) {
  return {
    zIndex: 10,
    opacity: 1,
    '&[x-placement*="bottom"] $arrow': {
      opacity: 1,
      left: 0,
      marginTop: '-0.95em',

      '&::before': {
        borderWidth: '0 0.5em 0.5em 0.5em',
        borderColor: `transparent transparent ${color} transparent`
      }
    },
    '&[x-placement*="bottom-end"] $arrow': {
      opacity: 1,
      left: `calc(100% - ${theme.spacing(1)}px - ${constants.arrowSize}) !important`,
      marginTop: '-0.95em',
      '&::before': {
        borderWidth: '0 0.5em 0.5em 0.5em',
        borderColor: `transparent transparent ${color} transparent`
      }
    },
    '&[x-placement*="bottom-start"] $arrow': {
      opacity: 1,
      left: `${theme.spacing(1)}px !important`,
      marginTop: '-0.95em',
      '&::before': {
        borderWidth: '0 0.5em 0.5em 0.5em',
        borderColor: `transparent transparent ${color} transparent`
      }
    },
    '&[x-placement*="top"] $arrow': {
      top: 39,
      left: 0,
      marginBottom: '-0.95em',
      '&::before': {
        borderWidth: '0.5em 0.5em 0 0.5em',
        borderColor: `${color} transparent transparent transparent`
      }
    },
    '&[x-placement*="right"] $arrow': {
      left: 0,
      marginLeft: '-0.95em',
      '&::before': {
        borderWidth: '0.5em 0.5em 0.5em 0',
        borderColor: `transparent ${color} transparent transparent`
      }
    },
    '&[x-placement*="left"] $arrow': {
      right: 0,
      marginRight: '-0.95em',
      '&::before': {
        borderWidth: '0.5em 0 0.5em 0.5em',
        borderColor: `transparent transparent transparent ${color}`
      }
    }
  }
}

const constants = {
  arrowSize: '3em'
}

const usestyles = makeStyles(theme => ({
  noWrap: {
    maxWidth: 'none',
    filter: 'drop-shadow(0 0 0px #aaaaaa)'
  },
  tooltip: {
    marginBottom: 5,
    background: theme.palette.colors.trueBlack,
    color: theme.typography.body1.color,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 8
  },
  arrow: {
    position: 'absolute',
    width: constants.arrowSize,
    height: constants.arrowSize,
    top: '0.5em',
    '&::before': {
      content: '""',
      margin: 'auto',
      display: 'block',
      width: 0,
      height: 0,
      borderStyle: 'solid'
    }
  },
  text: {
    color: theme.palette.colors.white,
    fontSize: 12,
    fontWeight: 500
  },
  arrowPopper: arrowGenerator(theme.palette.colors.trueBlack, theme)
}))

interface TooltipProps {
  children: ReactElement
  title?: string
  titleHTML?: ReactFragment
  noWrap?: boolean
  interactive?: boolean
  className?: string
  placement?: 'bottom' | 'top' | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  onClick?: (e: React.MouseEvent) => void
}

export const Tooltip: React.FC<React.ComponentProps<typeof MuiTooltip> & TooltipProps> = ({
  children,
  title,
  titleHTML,
  noWrap = false,
  interactive = false,
  className = '',
  placement = 'bottom',
  onClick = () => { },
  ...props
}) => {
  const classes = usestyles({})
  const [arrowRef, setArrowRef] = useState(null)
  return (
    <span onClick={e => onClick(e)}>
      <MuiTooltip
        {...props}
        title={
          <React.Fragment>
            {titleHTML || (
              <span className={classes.text}>
                {title.charAt(0).toUpperCase()}
                {title.slice(1)}
              </span>
            )}
            <span className={classes.arrow} ref={setArrowRef} />
          </React.Fragment>
        }
        classes={{
          tooltip: classNames({
            [classes.noWrap]: noWrap,
            [className]: className,
            [classes.tooltip]: true
          }),
          popper: classes.arrowPopper
        }}
        PopperProps={{
          popperOptions: {
            modifiers: {
              arrow: {
                enabled: Boolean(arrowRef),
                element: arrowRef
              }
            }
          }
        }}>
        {children}
      </MuiTooltip>
    </span>
  )
}

export default Tooltip
