import React from 'react'

import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'
import classNames from 'classnames'

const useStyles = makeStyles(theme => ({
  button: {
    maxWidth: 286,
    height: 60,
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
    },
    '&:disabled': {
      backgroundColor: theme.palette.colors.darkGray,
      opacity: 0.7
    }
  },
  inProgress: {
    '&:disabled': {
      backgroundColor: theme.palette.colors.zbayBlue,
      opacity: 1
    }
  },
  progress: {
    color: theme.palette.colors.white
  }
}))

interface LoadingButtonProps {
  inProgress?: boolean
  text?: string
  [index: string]: any
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  inProgress = false,
  text,
  ...other
}) => {
  const classes = useStyles({})

  return inProgress ? (
    <Button
      className={classNames({ [classes.button]: true, [classes.inProgress]: true })}
      {...other}>
      <CircularProgress className={classes.progress} />
    </Button>
  ) : (
    <Button className={classes.button} {...other}>
      {text || 'Continue'}
    </Button>
  )
}

export default LoadingButton
