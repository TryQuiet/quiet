import React, { FC } from 'react'
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import CopyToClipboard from 'react-copy-to-clipboard'
import { IconButton } from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

const PREFIX = 'InviteToCommunity'

const classes = {
  title: `${PREFIX}title`,
  titleDiv: `${PREFIX}titleDiv`,
  link: `${PREFIX}link`,
  button: `${PREFIX}button`,
  bold: `${PREFIX}bold`,
  linkContainer: `${PREFIX}linkContainer`,
  eyeIcon: `${PREFIX}eyeIcon`
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.title}`]: {},

  [`& .${classes.titleDiv}`]: {
    marginBottom: 24
  },
  [`& .${classes.link}`]: {
    marginTop: '16px',
    fontSize: '11px'
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
  },
  [`& .${classes.bold}`]: {
    fontWeight: 'bold'
  },

  [`& .${classes.linkContainer}`]: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    alignContent: 'stretch'
  },

  [`& .${classes.eyeIcon}`]: {
    margin: '5px',
    top: '5px'
  }
}))

export interface InviteComponentProps {
  invitationLink: string
  revealInputValue: boolean
  handleClickInputReveal: () => void
}

export const InviteComponent: FC<InviteComponentProps> = ({
  invitationLink,
  revealInputValue,
  handleClickInputReveal
}) => {
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
          <Grid item className={classes.linkContainer}>
            <Typography variant='body2' className={classes.link} data-testid='invitation-link'>
              {revealInputValue ? invitationLink : invitationLink?.replace(/./g, '•')}
            </Typography>
            <IconButton
              data-testid='show-invitation-link'
              size='small'
              onClick={handleClickInputReveal}
              className={classes.eyeIcon}>
              {!revealInputValue ? (
                <VisibilityOff color='primary' fontSize='small' />
              ) : (
                <Visibility color='primary' fontSize='small' />
              )}
            </IconButton>
          </Grid>
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
