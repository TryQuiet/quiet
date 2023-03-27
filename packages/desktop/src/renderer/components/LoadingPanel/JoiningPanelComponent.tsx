import React from 'react'
import { styled } from '@mui/material/styles'
import Modal from '../ui/Modal/Modal'
import JoinCommunityImg from '../../static/images/join-community.png'
import { Grid, Typography } from '@mui/material'

const PREFIX = 'JoiningPanelComponent'

const classes = {
  root: `${PREFIX}root`,
  spinner: `${PREFIX}spinner`,
  image: `${PREFIX}image`,
  contentWrapper: `${PREFIX}contentWrapper`,
  heading2: `${PREFIX}heading2`,
  link: `${PREFIX}link`,
  text: `${PREFIX}text`,
  progressBar: `${PREFIX}progressBar`,
  progress: `${PREFIX}progress`,
  progressBarWrapper: `${PREFIX}progressBarWrapper`
}

const StyledGrid = styled(Grid)(({ theme, width }) => ({
  [`&.${classes.root}`]: {
    textAlign: 'center',
    width: '100%',
    marginTop: '24px'
  },
  [`& .${classes.contentWrapper}`]: {
    maxWidth: '300px'
  },
  '@keyframes rotate': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' }
  },
  [`& .${classes.image}`]: {
    width: '120px',
    height: '115px',
    animationName: 'rotate',
    animationDuration: '8s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    transition: '2s all'
  },
  [`& .${classes.heading2}`]: {
    fontSize: '18px',
    marginTop: '12px'
  },
  [`& .${classes.link}`]: {
    color: theme.palette.colors.blue,
    cursor: 'pointer',
    marginTop: '16px'
  },
  [`& .${classes.text}`]: {
    color: theme.palette.colors.black30
  },
  [`& .${classes.progressBar}`]: {
    backgroundColor: theme.palette.colors.veryLightGray,
    width: '300px',
    height: '4px',
    position: 'relative',
    borderRadius: '100px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  [`& .${classes.progress}`]: {
    backgroundColor: theme.palette.colors.lushSky,
    width: width,
    height: '4px',
    position: 'relative'
  },
  [`& .${classes.progressBarWrapper}`]: {
    margin: '16px 0 40px'
  }
}))

export interface JoiningPanelComponentProps {
  open: boolean
  handleClose: () => void
  message: string
  openUrl: (url: string) => void
}

const JoiningPanelComponent: React.FC<JoiningPanelComponentProps> = ({
  open,
  handleClose,
  message,
  openUrl
}) => {
  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled={true}>
      {/* <StyledSpinnerLoader size={40} message={message} color={'black'} /> */}

      <StyledGrid width={100} container justifyContent='center' className={classes.root}>
        <Grid container alignItems='center' direction='column' className={classes.contentWrapper}>
          <img className={classes.image} src={JoinCommunityImg} />
          <Typography className={classes.heading2} variant='h2'>
            Joining now!
          </Typography>

          <div className={classes.progressBarWrapper}>
            <Grid
              container
              justifyContent='flex-start'
              alignItems='center'
              className={classes.progressBar}>
              <div className={classes.progress}></div>
            </Grid>
            <Typography variant='body2'>Connecting via Tor</Typography>
          </div>

          <Typography variant='body2' className={classes.text}>
            You can exit the app - we'll notify you once you're connected!
            <strong> This first time might take 30 seconds, 10 minutes, or even longer.</strong>
            <br />
            <br />
            There's a good reason why it's slow: Quiet stores data on your community’s devices (not
            Big Tech’s servers!) and uses the battle-tested privacy tool Tor to protect your
            information. Tor is fast once connected, but can take a long time to connect at first.
          </Typography>
          <a onClick={() => openUrl('https://tryquiet.org/')}>
            <Typography className={classes.link} variant='body2'>
              Learn more about Tor and Quiet
            </Typography>
          </a>
        </Grid>
      </StyledGrid>
    </Modal>
  )
}

export default JoiningPanelComponent
