import { IconButton } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'
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
  },
  linkContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    alignContent: 'stretch'
  },
  eyeIcon: {
    margin: '5px',
    top: '5px'
  }
}))

interface InviteFriendProps {
  communityName: string
  invitationUrl: string
  revealInputValue: boolean
  handleClickInputReveal: () => void
}

export const InviteToCommunity: FC<InviteFriendProps> = ({
  communityName,
  invitationUrl,
  revealInputValue,
  handleClickInputReveal
}) => {
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
      <Grid item className={classes.linkContainer}>
        <Typography variant='body2' data-testid='invitation-code'>{revealInputValue ? invitationUrl : invitationUrl?.replace(/./g, '•')}</Typography>
        <IconButton
          size='small'
          onClick={handleClickInputReveal}
          className={classes.eyeIcon}
        >
          {!revealInputValue ? (
            <VisibilityOff color='primary' fontSize='small' />
          ) : (
            <Visibility color='primary' fontSize='small' />
          )}
        </IconButton>
      </Grid>
      <Grid>
        <CopyToClipboard text={invitationUrl}>
          <Button className={classes.button}>Copy to clipboard</Button>
        </CopyToClipboard>
      </Grid>
    </Grid>
  )
}
