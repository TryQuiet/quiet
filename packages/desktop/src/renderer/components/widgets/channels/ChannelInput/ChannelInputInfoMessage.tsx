import React from 'react'
import { Grid, Typography } from '@mui/material'
import { makeStyles, Theme } from '@mui/material/styles'

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
}

const ChannelInputInfoMessage: React.FC<ChannelInputInfoMessageProps> = ({ showInfoMessage }) => {
  const classes = useStyles({})
  return (
    <Grid container className={classes.boot}>
      <Grid item xs>
        {showInfoMessage && (
          <Typography variant='caption' className={classes.info}>
              Initializing community. This may take a few minutes...
          </Typography>
        )}
      </Grid>
    </Grid>
  )
}

export default ChannelInputInfoMessage
