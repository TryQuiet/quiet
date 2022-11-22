import React from 'react'

import Button from '@mui/material/Button'
import { makeStyles } from '@mui/material/styles'
import { Typography } from '@mui/material'

import Tooltip from '../../ui/Tooltip/Tooltip'

const useStyles = makeStyles((theme) => ({
  button: {
    padding: 0,
    paddingLeft: 16,
    textTransform: 'none',
    textAlign: 'left',
    justifyContent: 'start',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.08)',
      opacity: 1
    },
    opacity: 0.7,
    color: theme.palette.colors.white
  },
  tooltip: {
    marginTop: 5
  }
}))

interface MoreButtonProps {
  tooltipText: string
  action: () => void
}

export const MoreButton: React.FC<MoreButtonProps> = ({ tooltipText, action }) => {
  const classes = useStyles({})
  return (
    <Tooltip title={tooltipText} className={classes.tooltip} placement='bottom'>
      <Button
        fullWidth
        variant='text'
        className={classes.button}
        onClick={action}
      >
        <Typography variant='body2'>more...</Typography>
      </Button>
    </Tooltip>
  )
}

export default MoreButton
