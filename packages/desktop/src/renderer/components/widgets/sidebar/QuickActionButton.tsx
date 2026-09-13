import React, { ReactElement } from 'react'

import { styled } from '@mui/material/styles'

import Button from '@mui/material/Button'

import { Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

const PREFIX = 'QuickActionButton'

const classes = {
  button: `${PREFIX}button`,
  icon: `${PREFIX}icon`,
  iconDiv: `${PREFIX}iconDiv`,
}

const StyledButton = styled(Button)(({ theme }) => ({
  [`&.${classes.button}`]: {
    marginTop: theme.space.sm,
    padding: 0,
    marginLeft: theme.space.lg,
    gap: theme.space.xs,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'inherit',
      opacity: 1,
    },
    opacity: 0.7,
    color: theme.palette.colors.white,
  },

  // The row's glyph is 12x12 in the design's 'List item' (library 3797:16037).
  [`& .${classes.icon}`]: {
    fontSize: 12,
  },

  [`& .${classes.iconDiv}`]: {
    display: 'flex',
  },
}))

interface QuickActionButtonProps {
  text: string
  action: () => void
  icon?: ReactElement<any, any>
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({ text, action, icon }) => {
  return (
    <StyledButton variant='text' className={classes.button} onClick={action}>
      {icon ? <div className={classes.iconDiv}>{icon}</div> : <AddIcon className={classes.icon} />}
      <Typography variant='body2'>{text}</Typography>
    </StyledButton>
  )
}

export default QuickActionButton
