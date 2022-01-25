import React from 'react'

import { makeStyles } from '@material-ui/core/styles'
import { Grid, Typography } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 0
  },
  divider: {
    height: 1,
    backgroundColor: theme.palette.colors.veryLightGray
  },
  titleDiv: {
    paddingLeft: 12,
    paddingRight: 12
  }
}))

interface MessagesDividerProps {
  title: string
}

export const MessagesDivider: React.FC<MessagesDividerProps> = ({ title }) => {
  const classes = useStyles({})
  return (
    <Grid container justify='center' alignItems='center'>
      <Grid item xs>
        <div className={classes.divider} />
      </Grid>
      <Grid item className={classes.titleDiv}>
        <Typography variant='body1'>{title}</Typography>
      </Grid>
      <Grid item xs>
        <div className={classes.divider} />
      </Grid>
    </Grid>
  )
}

export default MessagesDivider
