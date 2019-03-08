import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'

import MuiTooltip from '@material-ui/core/Tooltip'
import { withStyles } from '@material-ui/core/styles'

function arrowGenerator (color) {
  return {
    opacity: 1,
    '&[x-placement*="bottom"] $arrow': {
      opacity: 1,
      top: 0,
      left: 0,
      marginTop: '-0.95em',
      '&::before': {
        borderWidth: '0 1em 1em 1em',
        borderColor: `transparent transparent ${color} transparent`
      }
    },
    '&[x-placement*="top"] $arrow': {
      bottom: 0,
      left: 0,
      marginBottom: '-0.95em',
      '&::before': {
        borderWidth: '1em 1em 0 1em',
        borderColor: `${color} transparent transparent transparent`
      }
    },
    '&[x-placement*="right"] $arrow': {
      left: 0,
      marginLeft: '-0.95em',
      '&::before': {
        borderWidth: '1em 1em 1em 0',
        borderColor: `transparent ${color} transparent transparent`
      }
    },
    '&[x-placement*="left"] $arrow': {
      right: 0,
      marginRight: '-0.95em',
      '&::before': {
        borderWidth: '1em 0 1em 1em',
        borderColor: `transparent transparent transparent ${color}`
      }
    }
  }
}

const constants = {
  arrowSize: '3em'
}

const styles = theme => ({
  root: {
  },
  noWrap: {
    maxWidth: 'none',
    filter: 'drop-shadow(0 0 14px #aaaaaa)'
  },
  tooltip: {
    background: theme.palette.background.default,
    color: theme.typography.body1.color
  },
  arrow: {
    position: 'absolute',
    width: constants.arrowSize,
    height: constants.arrowSize,
    '&::before': {
      content: '""',
      margin: 'auto',
      display: 'block',
      width: 0,
      height: 0,
      borderStyle: 'solid'
    }
  },
  center: {
    left: `calc(50% - ${constants.arrowSize}) !important`
  },
  left: {
    left: `${theme.spacing.unit}px !important`
  },
  right: {
    left: `calc(100% - ${theme.spacing.unit}px - ${constants.arrowSize}) !important`
  },
  arrowPopper: arrowGenerator(theme.palette.background.default)
})

export const Tooltip = ({ classes, children, title, interactive, noWrap, placement }) => {
  const [arrowRef, setArrowRef] = useState(0)
  return (
    <MuiTooltip
      className={classes.root}
      title={
        <React.Fragment>
          {title}
          <span
            className={classNames({
              [classes.arrow]: true,
              [classes[placement]]: placement
            })}
            ref={setArrowRef} />
        </React.Fragment>
      }
      interactive={interactive}
      classes={{
        tooltip: classNames({
          [classes.noWrap]: noWrap,
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
      }}
    >
      {children}
    </MuiTooltip>
  )
}

Tooltip.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired,
  title: PropTypes.string.isRequired,
  placement: PropTypes.oneOf(['left', 'right', 'center']),
  interactive: PropTypes.bool,
  noWrap: PropTypes.bool
}

Tooltip.defaultProps = {
  noWrap: true,
  interactive: false,
  placement: 'center'
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(Tooltip)
