import React from 'react'

import { makeStyles } from '@material-ui/core/styles'
import Button, { ButtonProps } from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'

import classNames from 'classnames'

const useStyles = makeStyles(theme => ({
  button: {
    maxWidth: 286,
    minWidth: 100,
    height: 60,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue
    },
    '&:disabled': {
      opacity: 0.7
    }
  },
  inProgress: {
    '&:disabled': {
      backgroundColor: theme.palette.colors.quietBlue,
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
  classes?: Partial<ReturnType<typeof useStyles>>
}

export const LoadingButton: React.FC<ButtonProps & LoadingButtonProps> = ({
  inProgress = false,
  text = 'Continue',
  classes: customClasses,
  ...buttonProps
}) => {
  const classes = {
    ...useStyles({}),
    ...customClasses
  }

  return (
    <Button className={classNames(classes.button, { [classes.inProgress]: inProgress })} {...buttonProps}>
      {inProgress ? <CircularProgress size={20} className={classes.progress} data-testid={'loading-button-progress'} /> : text }
    </Button>
  )
}

export default LoadingButton
