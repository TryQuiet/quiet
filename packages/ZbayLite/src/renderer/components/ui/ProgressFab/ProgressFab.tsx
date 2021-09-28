import React, { ReactElement } from 'react'
import classNames from 'classnames'

import Fab from '@material-ui/core/Fab'
import CircularProgress from '@material-ui/core/CircularProgress'
import green from '@material-ui/core/colors/green'
import CheckIcon from '@material-ui/icons/Check'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(() => ({
  root: {
    backgroundColor: '#8d8d8d',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#737373'
    }
  },
  fabProgress: {
    color: green[500],
    position: 'absolute',
    left: -6,
    top: -6,
    zIndex: 1
  },
  wrapper: {
    position: 'relative'
  },
  buttonSuccess: {
    '&:disabled': {
      backgroundColor: green[500],
      color: '#fff'
    }
  }
}))

interface ProgressFabProps {
  className?: string
  children: ReactElement
  loading?: boolean
  success?: boolean
  disabled?: boolean
  onClick?: () => void
  [s: string]: any
}

export const ProgressFab: React.FC<ProgressFabProps> = ({
  className,
  children,
  loading = false,
  success = false,
  disabled = false,
  onClick,
  ...props
}) => {
  const classes = useStyles({})
  return (
    <div className={
      classNames({
        [classes.wrapper]: true,
        [className]: className
      })
    }>
      <Fab
        classes={{
          root: classNames({
            [classes.root]: true,
            [classes.buttonSuccess]: success
          })
        }}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {success ? <CheckIcon /> : children }
      </Fab>
      {loading && <CircularProgress size={68} className={classes.fabProgress} />}
    </div>
  )
}

export default ProgressFab
