import React, { useCallback } from 'react'
import { styled } from '@mui/material/styles'
import SpinnerLoader from '../ui/Spinner/SpinnerLoader'
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
  text: `${PREFIX}text`
}

// const StyledSpinnerLoader = styled(SpinnerLoader)(() => ({
//   top: '50%',
//   position: 'relative',
//   transform: 'translate(0, -50%)'
// }))

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    textAlign: 'center',
    // maxWidth: '300px'
    width: '100%',
    marginTop: '24px'
    // paddingTop: '30px',
    // minHeight: '100%',
    // width: '220px',
    // position: 'relative',
    // backgroundImage: 'linear-gradient(290.29deg, #521576 18.61%, #E42656 96.07%)',
    // color: theme.palette.colors.white
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

      <StyledGrid container justifyContent='center' className={classes.root}>
        <Grid container alignItems='center' direction='column' className={classes.contentWrapper}>
          <img className={classes.image} src={JoinCommunityImg} />
          <Typography className={classes.heading2} variant='h2'>
            Joining now!
          </Typography>

          <Typography variant='body2'>Connecting via Tor</Typography>
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
