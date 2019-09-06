import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'

import Popper from '@material-ui/core/Popper'
import Grow from '@material-ui/core/Grow'
import Paper from '@material-ui/core/Paper'
import { withStyles } from '@material-ui/core/styles'

const constants = {
  arrowSize: 10
}

const styles = theme => ({
  wrapper: {
    filter: 'drop-shadow(0 0 14px #aaaaaa)'
  },
  paper: {
    background: theme.palette.background.default,
    boxShadow: 'none'
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
})

export const PopupMenu = ({ open, anchorEl, classes, children, className, offset, placement }) => {
  const [arrowRef, setArrowRef] = useState(null)
  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      transition
      placement={placement || 'bottom-end'}
      disablePortal
      className={classes.popper}
      modifiers={{
        arrow: {
          enabled: Boolean(arrowRef),
          element: arrowRef
        },
        offset: {
          offset
        }
      }}
    >
      {({ TransitionProps, placement }) => {
        return (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
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
                  [classes.arrow]: true,
                  [classes[R.split('-', placement)[0]]]: true
                })}
                ref={setArrowRef}
              />
            </div>
          </Grow>
        )
      }}
    </Popper>
  )
}

PopupMenu.propTypes = {
  open: PropTypes.bool.isRequired,
  anchorEl: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(React.Element) })
  ]),
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  placement: PropTypes.string,
  offset: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}

PopupMenu.defaultProps = {
  offset: 0,
  open: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(PopupMenu)
