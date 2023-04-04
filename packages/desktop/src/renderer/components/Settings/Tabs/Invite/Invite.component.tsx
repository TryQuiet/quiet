import React, { FC } from 'react'
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import CopyToClipboard from 'react-copy-to-clipboard'

const PREFIX = 'InviteToCommunity'

const classes = {
  title: `${PREFIX}title`,
  titleDiv: `${PREFIX}titleDiv`,
  link: `${PREFIX}link`,
  button: `${PREFIX}button`
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.title}`]: {},

  [`& .${classes.titleDiv}`]: {
    marginBottom: 24
  },
  [`& .${classes.link}`]: {
    color: theme.palette.colors.linkBlue,
    cursor: 'pointer',
    marginTop: '16px',
    fontSize: '12px'
  },
  [`& .${classes.button}`]: {
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
  }
}))

export interface InviteComponentProps {
  invitationLink: string
  openUrl: (url: string) => void
}

export const InviteComponent: FC<InviteComponentProps> = ({ invitationLink, openUrl }) => {
  return (
    <StyledGrid container direction='column'>
      <Grid
        container
        item
        justifyContent='space-between'
        alignItems='center'
        className={classes.titleDiv}>
        <Grid item className={classes.title}>
          <Typography variant='h3' data-testid='invite-a-friend'>
            Invite a friend
          </Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Grid item>
          <Typography variant='h5'>Your community link</Typography>
        </Grid>
        <Grid item>
          <Typography variant='body2'>
            Anyone with Quiet app can follow this link to join this community.
            <br /> Only share with people you trust.
          </Typography>
          <a onClick={() => openUrl(invitationLink)}>
            <Typography data-testid='invitation-link' className={classes.link} variant='body2'>
              {invitationLink}
            </Typography>
          </a>
        </Grid>
      </Grid>
      <Grid>
        <CopyToClipboard text={invitationLink}>
          <Button data-testid='copy-invitation-link' className={classes.button}>
            Copy to clipboard
          </Button>
        </CopyToClipboard>
      </Grid>
    </StyledGrid>
  )
}
