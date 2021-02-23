import React from 'react'
import { Grid, Typography } from '@material-ui/core'
import { makeStyles, Theme } from '@material-ui/core/styles'

const useStyles = makeStyles((theme: Theme) => ({
  info: {
    color: theme.palette.colors.trueBlack,
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

const TypingIndicator = ({ contactUsername, showTypingIndicator }) => {
  const classes = useStyles({})

  return (
    <Grid container className={classes.boot}>
      <Grid item xs>
        {showTypingIndicator && (
          <Typography variant='caption' className={classes.info}>
            <span className={classes.bold}>{contactUsername}</span> is typing...
          </Typography>
        )}
      </Grid>
    </Grid>
  )
}

export default TypingIndicator
