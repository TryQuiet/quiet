import React from 'react'

import { styled } from '@mui/material/styles'
import Button, { ButtonClasses, ButtonProps } from '@mui/material/Button'

import { primaryButtonStates } from '../interactionStates'

/**
 * The app's primary button. It used to swap its label for a spinner while the
 * action ran (`inProgress`), which the Quiet Design Library has no variant for
 * - Button set 3505:10206 is Default / Hover / Disabled only. An action in
 * progress is ui/ActionProgress instead, and the button goes away while it
 * runs, so that affordance is gone.
 */

const PREFIX = 'LoadingButton'

const classes = {
  button: `${PREFIX}button`,
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
}))

interface LoadingButtonClasses extends ButtonClasses {
  button?: string
}

interface LoadingButtonProps {
  text?: string
  classes?: Partial<LoadingButtonClasses>
}

export const LoadingButton: React.FC<ButtonProps & LoadingButtonProps> = ({
  text = 'Continue',
  classes: customClasses,
  ...buttonProps
}) => {
  const mergedClasses = {
    ...classes,
    ...customClasses,
  }

  return (
    <StyledButton className={mergedClasses.button} {...buttonProps}>
      {text}
    </StyledButton>
  )
}

export default LoadingButton
