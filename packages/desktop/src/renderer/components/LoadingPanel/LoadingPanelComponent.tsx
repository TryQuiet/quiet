import React from 'react'
import { styled } from '@mui/material/styles'
import SpinnerLoader from '../ui/Spinner/SpinnerLoader'
import Modal from '../ui/Modal/Modal'
import JoinCommunityImg from '../../static/images/join-community.png'
import { Grid, Typography } from '@mui/material'

const PREFIX = 'LoadingPanelComponent'

const classes = {
  root: `${PREFIX}root`,
  spinner: `${PREFIX}spinner`,
  image: `${PREFIX}image`
}

// const StyledSpinnerLoader = styled(SpinnerLoader)(() => ({
//   top: '50%',
//   position: 'relative',
//   transform: 'translate(0, -50%)'
// }))

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    textAlign: 'center',
    maxWidth: '300px'
    // paddingTop: '30px',
    // minHeight: '100%',
    // width: '220px',
    // position: 'relative',
    // backgroundImage: 'linear-gradient(290.29deg, #521576 18.61%, #E42656 96.07%)',
    // color: theme.palette.colors.white
  },

  [`& .${classes.image}`]: {
    width: '125px',
    height: '120px'
  }
}))

export interface LoadingPanelComponentProps {
  open: boolean
  handleClose: () => void
  message: string
}

const LoadingPanelComponent: React.FC<LoadingPanelComponentProps> = ({
  open,
  handleClose,
  message
}) => {
  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled={true}>
      {/* <StyledSpinnerLoader size={40} message={message} color={'black'} /> */}

      <StyledGrid container alignItems='center' justifyContent='center' className={classes.root}>
        <div>
          <img className={classes.image} src={JoinCommunityImg} />
          <Typography variant='h2'>Joining now!</Typography>

          <Typography variant='body2'>Connecting via Tor</Typography>
          <Typography variant='body2'>
            You can exit the app - we'll notify you once you're connected!
            <strong> This first time might take 30 seconds, 10 minutes, or even longer.</strong>
            <br />
            <br />
            There's a good reason why it's slow: Quiet stores data on your community’s devices (not
            Big Tech’s servers!) and uses the battle-tested privacy tool Tor to protect your
            information. Tor is fast once connected, but can take a long time to connect at first.
          </Typography>
        </div>
      </StyledGrid>
    </Modal>
  )
}

export default LoadingPanelComponent
