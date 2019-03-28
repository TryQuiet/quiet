import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import red from '@material-ui/core/colors/red'
import blue from '@material-ui/core/colors/blue'
import amber from '@material-ui/core/colors/amber'
import lightGreen from '@material-ui/core/colors/lightGreen'
import { withStyles } from '@material-ui/core/styles'

const styles = {
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
      opacity: 0
    },
    '70%': {
      transform: 'scale(1.6)',
      opacity: 1
    },
    '100%': {
      transform: 'scale(2)',
      opacity: 0
    }
  },
  root: {
    display: 'inline-block',
    position: 'relative',
    width: ({ size }) => `${size}px`,
    height: ({ size }) => `${size}px`,
    zIndex: 2,
    borderRadius: '50%',
    '&:after': {
      content: '""',
      zIndex: 1,
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      opacity: 0,
      animation: 'pulse 2s infinite'
    }
  },
  healthy: {
    background: lightGreen[600],
    '&:after': {
      background: `${lightGreen[500]}77`
    }
  },
  syncing: {
    background: blue[500],
    '&:after': {
      background: `${blue[500]}77`
    }
  },
  connecting: {
    background: blue[500],
    '&:after': {
      background: `${blue[500]}77`
    }
  },
  restarting: {
    background: amber[500],
    '&:after': {
      background: `${amber[500]}77`
    }
  },
  down: {
    background: red[500],
    '&:after': {
      background: `${red[500]}77`
    }
  }
}

export const PulseDot = ({ classes, className, size, color }) => (
  <div
    className={classNames({
      [classes.root]: true,
      [classes[color]]: color,
      [className]: className
    })}
    style={{
      width: size,
      height: size
    }}
  />
)

PulseDot.propTypes = {
  classes: PropTypes.object.isRequired,
  color: PropTypes.oneOf(['healthy', 'syncing', 'down', 'restarting', 'connecting']).isRequired,
  className: PropTypes.string,
  size: PropTypes.number
}

PulseDot.defaultProps = {
  size: 16,
  className: ''
}

export default React.memo(withStyles(styles)(PulseDot))
