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
    marginTop: 8,
    padding: 0,
    marginLeft: 16,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'inherit',
      opacity: 1,
    },
    opacity: 0.7,
    color: theme.palette.colors.white,
  },

  [`& .${classes.icon}`]: {
    fontSize: 12,
    marginRight: 2,
    marginLeft: -2,
    marginBottom: 2,
  },

  [`& .${classes.iconDiv}`]: {
    marginRight: 5,
    marginBottom: 2,
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
