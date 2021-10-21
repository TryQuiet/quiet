import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import React, { FC } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'

const useStyles = makeStyles((theme) => ({
  title: {},
  titleDiv: {
    marginBottom: 24
  },
  alignLabel: {
    marginTop: 3
  },
  labelDiv: {
    marginTop: 16,
    marginBottom: 24
  },
  itemName: {
    fontSize: 14
  },
  imageHostsDiv: {
    marginTop: 32
  },
  button: {
    height: 60,
    marginTop: 24,
    width: 168,
    fontSize: 16,
    backgroundColor: theme.palette.colors.zbayBlue,
    marginBottom: 24
  },
  rescanButton: {
    height: 60,
    marginTop: 24,
    width: 240,
    fontSize: 16,
    backgroundColor: theme.palette.colors.zbayBlue,
    marginBottom: 24
  },
  link: {
    textDecoration: 'none',
    color: theme.palette.colors.linkBlue
  },
  copyButton: {
    marginTop: 24,
    textTransform: 'none',
    width: 488,
    height: 60,
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.purple
  },
  bold: {
    fontWeight: 'bold'
  }
}))

interface InviteFriendProps {
  communityName: string
  invitationUrl: string
}

interface InvitationUrlProps {
  url: string
}

const InvitationUrl: FC<InvitationUrlProps> = ({
  url
}) => {
  const classes = useStyles({})
  return (
    <Grid item>
      <Grid item>
        <Typography variant='body2'>
          {url}
        </Typography>
      </Grid>
      <Grid>
        <CopyToClipboard text={url}>
          <Button className={classes.copyButton}>
            Copy to clipboard
          </Button>
        </CopyToClipboard>
      </Grid>
    </Grid>
  )
}

export const InviteToCommunity: FC<InviteFriendProps> = ({
  communityName,
  invitationUrl
}) => {
  const classes = useStyles({})
  const [linkDisplayed, displayLink] = React.useState(false)
  return (
    <Grid container direction='column'>
      <Grid container item justify='space-between' alignItems='center' className={classes.titleDiv}>
        <Grid item className={classes.title}>
          <Typography variant='h3'>Invite a friend</Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Grid item>
          <Typography variant='body2'>
          Get a link to invite friends to <span className={classes.bold}>{communityName}</span>
          </Typography>
        </Grid>
      </Grid>

      <Grid>
        {linkDisplayed ? <InvitationUrl url={invitationUrl} /> : <Button
          variant='contained'
          size='large'
          color='primary'
          type='submit'
          fullWidth
          className={classes.button}
          onClick={() => {
            displayLink(true)
          }}
        >
          Create link
        </Button>}
      </Grid>
    </Grid>
  )
}
