import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'

import Icon from '../../ui/Icon/Icon'
import ErrorIcon from '../../../static/images/t-error.svg'

const useStyles = makeStyles((theme) => ({
  warrning: {
    marginLeft: 8,
    letterSpacing: 0.4,
    color: theme.palette.colors.error
  },
  tryAgain: {
    marginLeft: 4,
    letterSpacing: 0.4,
    color: theme.palette.colors.linkBlue,
    '&:hover': {
      color: theme.palette.colors.blue
    }
  },
  pointer: {
    cursor: 'pointer'
  }
}))

interface ChannelMessageActionsProps {
  onResend: () => void
}

export const ChannelMessageActions: React.FC<ChannelMessageActionsProps> = ({ onResend }) => {
  const classes = useStyles({})
  return (
    <Grid container direction='row' justify='flex-start' alignItems='center'>
      {
        <React.Fragment>
          <Icon src={ErrorIcon} />
          <Grid item>
            <Typography variant='caption' className={classes.warrning}>
              Coudn't send.
            </Typography>
          </Grid>
          <Grid item className={classes.pointer} onClick={onResend}>
            <Typography variant='caption' className={classes.tryAgain}>
              Try again
            </Typography>
          </Grid>
        </React.Fragment>
      }
    </Grid>
  )
}

export default ChannelMessageActions
