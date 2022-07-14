import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import React, { FC } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'

const useStyles = makeStyles(theme => ({
  title: {},
  titleDiv: {
    marginBottom: 24
  },
  link: {
    textDecoration: 'none',
    color: theme.palette.colors.linkBlue
  },
  button: {
    marginTop: 24,
    textTransform: 'none',
    width: 480,
    height: 60,
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.quietBlue,
    '&:hover': {
      opacity: 0.7,
      backgroundColor: theme.palette.colors.quietBlue
    }
  },
  bold: {
    fontWeight: 'bold'
  }
}))

interface InviteFriendProps {
  communityName: string
  invitationUrl: string
}

export const InviteToCommunity: FC<InviteFriendProps> = ({ communityName, invitationUrl }) => {
  const classes = useStyles({})
  return (
    <Grid container direction='column'>
      <Grid container item justify='space-between' alignItems='center' className={classes.titleDiv}>
        <Grid item className={classes.title}>
          <Typography variant='h3'>Add members</Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Grid item >
          <Typography variant='h5'>Your invitation code</Typography>
        </Grid>
        <Grid item>
          <Typography variant='body2'>
            To add members to <span className={classes.bold}>{communityName}</span>, send them this invite code via a secure channel, e.g. Signal. You must be online the first time they join.
          </Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Typography variant='body2' data-testid='invitation-code'>{invitationUrl}</Typography>
      </Grid>
      <Grid>
        <CopyToClipboard text={invitationUrl}>
          <Button className={classes.button}>Copy to clipboard</Button>
        </CopyToClipboard>
      </Grid>
    </Grid>
  )
}
