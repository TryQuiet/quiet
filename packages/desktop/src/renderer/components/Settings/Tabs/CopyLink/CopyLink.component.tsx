import React, { FC } from 'react'
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import CopyToClipboard from 'react-copy-to-clipboard'

const PREFIX = 'CopyLink'

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
    textDecoration: 'none',
    color: theme.palette.colors.linkBlue
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
  [`& .${classes.link}`]: {
    color: theme.palette.colors.blue,
    cursor: 'pointer',
    marginTop: '16px',
    fontSize: '14px'
  }
}))

export interface CopyLinkComponentProps {
  invitationLink: string
  openUrl: (url: string) => void
}

const CopyLinkComponent: FC<CopyLinkComponentProps> = ({ invitationLink, openUrl }) => {
  const linkText = invitationLink.length > 60 ? `${invitationLink.slice(0, 67)}...` : invitationLink

  return (
    <StyledGrid container direction='column'>
      <Grid
        container
        item
        justifyContent='space-between'
        alignItems='center'
        className={classes.titleDiv}>
        <Grid item className={classes.title}>
          <Typography variant='h3'>Your community link</Typography>
        </Grid>
      </Grid>
      <Grid item>
        {/* <Grid item>
          <Typography variant='h5'>Your community link</Typography>
        </Grid> */}
        <Grid item>
          <Typography variant='body2'>
            Anyone with Quiet app can follow this link to join this community.
            <br /> Only share with people you trust.
          </Typography>

          <a onClick={() => openUrl(invitationLink)}>
            <Typography className={classes.link} variant='body2'>
              {linkText}
            </Typography>
          </a>
        </Grid>
      </Grid>
      <Grid>
        <CopyToClipboard text={invitationLink}>
          <Button className={classes.button}>Copy to clipboard</Button>
        </CopyToClipboard>
      </Grid>
    </StyledGrid>
  )
}

export default CopyLinkComponent
