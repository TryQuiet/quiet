import React from 'react'

import { styled } from '@mui/material/styles'
import Button, { ButtonClasses, ButtonProps } from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

import classNames from 'classnames'

import { primaryButtonStates } from '../interactionStates'

const PREFIX = 'LoadingButton'

const classes = {
  button: `${PREFIX}button`,
  inProgress: `${PREFIX}inProgress`,
  progress: `${PREFIX}progress`,
}

const StyledButton = styled(Button)(({ theme }) => ({
  // Hover / pressed / focus-visible / disabled for every caller, including those passing their own `button` class.
  ...primaryButtonStates(theme),
  [`&.${classes.button}`]: {
    maxWidth: 286,
    minWidth: 100,
    height: 60,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
  },

  // A button showing progress is disabled but keeps its full colour.
  [`&&.${classes.inProgress}.Mui-disabled`]: {
    backgroundColor: theme.palette.colors.quietBlue,
    opacity: 1,
  },

  [`& .${classes.progress}`]: {
    color: theme.palette.colors.white,
  },
}))

interface LoadingButtonClasses extends ButtonClasses {
  button?: string
}

interface LoadingButtonProps {
  inProgress?: boolean
  text?: string
  classes?: Partial<LoadingButtonClasses>
}

export const LoadingButton: React.FC<ButtonProps & LoadingButtonProps> = ({
  inProgress = false,
  text = 'Continue',
  classes: customClasses,
  ...buttonProps
}) => {
  const mergedClasses = {
    ...classes,
    ...customClasses,
  }

  return (
    <StyledButton
      className={classNames(mergedClasses.button, { [mergedClasses.inProgress]: inProgress })}
      {...buttonProps}
    >
      {inProgress ? (
        <CircularProgress size={20} className={mergedClasses.progress} data-testid={'loading-button-progress'} />
      ) : (
        text
      )}
    </StyledButton>
  )
}

export default LoadingButton
