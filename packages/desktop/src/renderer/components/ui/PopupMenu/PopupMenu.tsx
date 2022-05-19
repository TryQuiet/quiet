import React, { useRef } from 'react'
import classNames from 'classnames'
import Popper from '@material-ui/core/Popper'
import Grow from '@material-ui/core/Grow'
import Paper from '@material-ui/core/Paper'
import { makeStyles } from '@material-ui/core/styles'
import { IPopupMenuProps } from './PopupMenu.d'

const constants = {
  arrowSize: 10
}

const useStyles = makeStyles((theme) => ({
  wrapper: {},
  paper: {
    background: theme.palette.background.default,
    boxShadow: '0px 2px 25px rgba(0, 0, 0, 0.2)',
    borderRadius: 8
  },
  arrow: {
    opacity: 1,
    position: 'absolute',
    width: 2 * constants.arrowSize,
    height: 2 * constants.arrowSize,
    '&::before': {
      content: '""',
      margin: 'auto',
      display: 'block',
      width: 0,
      height: 0,
      borderStyle: 'solid'
    }
  },
  bottom: {
    top: 0,
    marginTop: `-${constants.arrowSize}px`,
    '&::before': {
      borderWidth: `0 ${constants.arrowSize}px ${constants.arrowSize}px ${constants.arrowSize}px`,
      borderColor: `transparent transparent ${theme.palette.background.default} transparent`
    }
  },
  top: {
    bottom: 0,
    marginBottom: `-${2 * constants.arrowSize}px`,
    '&::before': {
      borderWidth: `${constants.arrowSize}px ${constants.arrowSize}px 0 ${constants.arrowSize}px`,
      borderColor: `${theme.palette.background.default} transparent transparent transparent`
    }
  },
  popper: {
    zIndex: 100
  }
}))

export const PopupMenu: React.FC<IPopupMenuProps> = ({
  open = false,
  anchorEl,
  children,
  className = '',
  offset = 0,
  placement = 'bottom-end'
}) => {
  const classes = useStyles({})
  const arrowRef = useRef<HTMLSpanElement>(null)
  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      transition
      placement={placement}
      disablePortal
      className={classes.popper}
      modifiers={{
        arrow: {
          enabled: Boolean(arrowRef.current),
          element: arrowRef.current
        },
        offset: {
          offset
        }
      }}
    >
      {({ TransitionProps, placement }) => {
        const splitPlacement: keyof typeof classes = placement.split('-')[0] as 'wrapper' | 'paper' | 'bottom' | 'top' | 'arrow' | 'popper'
        return (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom'
            }}
          >
            <div className={classes.wrapper}>
              <Paper
                className={classNames({
                  [classes.paper]: true,
                  [className]: className
                })}
              >
                {children}
              </Paper>
              <span
                className={classNames({
                  [classes[splitPlacement]]: true
                })}
                ref={arrowRef}
              />
            </div>
          </Grow>
        )
      }}
    </Popper>
  )
}

export default PopupMenu
