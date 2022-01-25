import React from 'react'
import { Grid, Typography } from '@material-ui/core'
import { makeStyles, Theme } from '@material-ui/core/styles'

const useStyles = makeStyles((theme: Theme) => ({
  info: {
    color: theme.palette.colors.trueBlack,
    width: '100px',
    letterSpacing: '0.4px'
  },
  bold: {
    fontWeight: 'bold'
  },
  boot: {
    height: '24px',
    width: '100%',
    padding: '0px 20px'
  }
}))

interface ChannelInputInfoMessageProps {
  showInfoMessage: boolean
  inputState: number
}

const ChannelInputInfoMessage: React.FC<ChannelInputInfoMessageProps> = ({ showInfoMessage, inputState }) => {
  const classes = useStyles({})
  return (
    <Grid container className={classes.boot}>
      <Grid item xs>
        {showInfoMessage && (
          <Typography variant='caption' className={classes.info}>
            {inputState === 0
              ? 'Loading messages and connecting. This may take a few minutes...'
              : 'This user needs to update Zbay to receive direct messages.'}
          </Typography>
        )}
      </Grid>
    </Grid>
  )
}

export default ChannelInputInfoMessage
