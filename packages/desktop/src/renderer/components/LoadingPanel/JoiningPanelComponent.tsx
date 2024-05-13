import React from 'react'
import { styled } from '@mui/material/styles'
import Modal from '../ui/Modal/Modal'
import JoinCommunityImg from '../../static/images/join-community.png'
import { Grid, Typography } from '@mui/material'
import { Site } from '@quiet/common'
import { ConnectionProcessInfo } from '@quiet/types'
import classNames from 'classnames'

const PREFIX = 'JoiningPanelComponent'

const classes = {
  root: `${PREFIX}root`,
  spinner: `${PREFIX}spinner`,
  image: `${PREFIX}image`,
  animatedImage: `${PREFIX}animatedImage`,
  contentWrapper: `${PREFIX}contentWrapper`,
  heading2: `${PREFIX}heading2`,
  link: `${PREFIX}link`,
  text: `${PREFIX}text`,
  progressBar: `${PREFIX}progressBar`,
  progress: `${PREFIX}progress`,
  progressBarWrapper: `${PREFIX}progressBarWrapper`,
  animatedProgress: `${PREFIX}animatedProgress`,
}

const StyledGrid = styled(Grid)(({ theme, width }) => ({
  [`&.${classes.root}`]: {
    textAlign: 'center',
    width: '100%',
  },
  [`& .${classes.contentWrapper}`]: {
    maxWidth: '450px',
  },
  '@keyframes rotate': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  [`& .${classes.animatedImage}`]: {
    width: '120px',
    height: '115px',
    animationName: 'rotate',
    animationDuration: '8s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    transition: '2s all',
  },
  [`& .${classes.image}`]: {
    width: '120px',
    height: '115px',
  },
  [`& .${classes.heading2}`]: {
    fontSize: '18px',
    marginTop: '12px',
  },
  [`& .${classes.link}`]: {
    color: theme.palette.colors.blue,
    cursor: 'pointer',
    marginTop: '16px',
  },
  [`& .${classes.text}`]: {
    color: theme.palette.colors.gray70,
  },
  [`& .${classes.progressBar}`]: {
    backgroundColor: theme.palette.background.paper,
    width: '300px',
    height: '4px',
    position: 'relative',
    borderRadius: '100px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  '@keyframes width': {
    from: { width: '150px' },
    to: { width: '300px' },
  },
  [`& .${classes.animatedProgress}`]: {
    animationName: 'width',
    animationDuration: '4s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    transition: '3s all',
    backgroundColor: theme.palette.colors.lushSky,
    position: 'absolute',
    zIndex: 1,
    height: '4px',
  },
  [`& .${classes.progress}`]: {
    backgroundColor: theme.palette.colors.blue,
    width: width,
    height: '4px',
    position: 'relative',
    zIndex: 2,
  },
  [`& .${classes.progressBarWrapper}`]: {
    // margin: '16px 0 40px',

    margin: '16px 0 20px',
  },
}))

export interface JoiningPanelComponentProps {
  open: boolean
  handleClose: () => void
  openUrl: (url: string) => void
  connectionInfo: { number: number; text: ConnectionProcessInfo }
  isOwner: boolean
}

const JoiningPanelComponent: React.FC<JoiningPanelComponentProps> = ({
  open,
  handleClose,
  openUrl,
  connectionInfo,
  isOwner,
}) => {
  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled={true} withoutHeader>
      <StyledGrid container justifyContent='center' className={classes.root} width={connectionInfo.number * 3}>
        <Grid
          container
          alignItems='center'
          direction='column'
          className={classes.contentWrapper}
          data-testid='joiningPanelComponent'
        >
          <img className={isOwner ? classes.image : classes.animatedImage} src={JoinCommunityImg} />
          <Typography className={classes.heading2} variant='h2'>
            Joining now!
          </Typography>

          <div className={classes.progressBarWrapper}>
            <Grid container justifyContent='flex-start' alignItems='center' className={classes.progressBar}>
              <div className={classes.progress}></div>

              <div
                className={classNames({
                  [classes.animatedProgress]: connectionInfo.text === ConnectionProcessInfo.CONNECTING_TO_COMMUNITY,
                })}
              ></div>
            </Grid>
            <Typography variant='body2'>{connectionInfo.text}</Typography>
          </div>

          <Typography variant='body2' className={classes.text}>
            <strong>
              Please leave the app open. <br /> Joining the first time can take a few minutes or more.
            </strong>
            <br />
            <br />
            Quiet stores data on <i>your</i> community’s devices (not Big Tech’s servers!) using the battle-tested
            privacy tool Tor to protect your information. Tor is fast once connected, but it can be slow at first, and
            closing this window will stop the process of joining.
          </Typography>
          <a onClick={() => openUrl(Site.MAIN_PAGE)}>
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
