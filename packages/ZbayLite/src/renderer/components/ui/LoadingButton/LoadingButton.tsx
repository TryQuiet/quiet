import React from 'react'

import { makeStyles } from '@material-ui/core/styles'
import Button, { ButtonProps } from '@material-ui/core/Button'
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
      {inProgress ? <CircularProgress className={classes.progress} /> : text }
    </Button>
  )
}

export default LoadingButton
