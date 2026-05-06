import React from 'react'

import { styled } from '@mui/material/styles'

import Button from '@mui/material/Button'

import { Typography } from '@mui/material'

import Tooltip from '../../ui/Tooltip/Tooltip'

const PREFIX = 'MoreButton'

const classes = {
  button: `${PREFIX}button`,
  tooltip: `${PREFIX}tooltip`,
}

const StyledTooltip = styled(Tooltip)(({ theme }) => ({
  [`& .${classes.button}`]: {
    padding: 0,
    paddingLeft: 16,
    textTransform: 'none',
    textAlign: 'left',
    justifyContent: 'start',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.08)',
      opacity: 1,
    },
    opacity: 0.7,
    color: theme.palette.colors.white,
  },

  [`&.${classes.tooltip}`]: {
    marginTop: 5,
  },
}))

interface MoreButtonProps {
  tooltipText: string
  action: () => void
}

export const MoreButton: React.FC<MoreButtonProps> = ({ tooltipText, action }) => {
  return (
    <StyledTooltip title={tooltipText} className={classes.tooltip} placement='bottom'>
      <Button fullWidth variant='text' className={classes.button} onClick={action}>
        <Typography variant='body2'>more...</Typography>
      </Button>
    </StyledTooltip>
  )
}

export default MoreButton
