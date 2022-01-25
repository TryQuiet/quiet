import React from 'react'
import classNames from 'classnames'

import red from '@material-ui/core/colors/red'
import blue from '@material-ui/core/colors/blue'
import amber from '@material-ui/core/colors/amber'
import lightGreen from '@material-ui/core/colors/lightGreen'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles<PulseDotProps>(({ size }) => ({
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
    width: `${size}px`,
    height: `${size}px`,
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
      animation: '$pulse 2s infinite'
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
}))

interface PulseDotProps {
  className?: string
  size?: number
  color: 'healthy' | 'syncing' | 'down' | 'restarting' | 'connecting'
}

export const PulseDot: React.FC<PulseDotProps> = ({ className = '', size = 16, color }) => {
  const classes = useStyles({ size })
  return (
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
}

export default PulseDot
