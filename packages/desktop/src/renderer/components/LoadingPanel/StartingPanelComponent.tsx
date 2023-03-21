import React, { useCallback } from 'react'
import { styled } from '@mui/material/styles'
import SpinnerLoader from '../ui/Spinner/SpinnerLoader'
import Modal from '../ui/Modal/Modal'
import QuietLogo from '../../static/images/quiet-logo.png'
import { Grid, Typography } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'

const PREFIX = 'StartingPanelComponent'

const classes = {
  root: `${PREFIX}root`,
  spinner: `${PREFIX}spinner`,
  image: `${PREFIX}image`,
  contentWrapper: `${PREFIX}contentWrapper`,
  heading2: `${PREFIX}heading2`,
  link: `${PREFIX}link`,
  text: `${PREFIX}text`,
  progressBar: `${PREFIX}progressBar`,
  progress: `${PREFIX}progress`
}

// const StyledSpinnerLoader = styled(SpinnerLoader)(() => ({
//   top: '50%',
//   position: 'relative',
//   transform: 'translate(0, -50%)'
// }))

const StyledGrid = styled(Grid)(({ theme, width }) => ({
  [`&.${classes.root}`]: {
    textAlign: 'center',
    // maxWidth: '300px'
    marginTop: '24px',
    width: '100%'
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
  [`& .${classes.image}`]: {
    width: '95px',
    height: '95px',
    marginBottom: '58px'
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
    marginBottom: '16px'
    // display: 'flex',
  },
  [`& .${classes.progress}`]: {
    backgroundColor: theme.palette.colors.blue,
    width: width,
    height: '4px',
    position: 'relative'
    // display: 'flex',
  }
}))

export interface StartingPanelComponentProps {
  open: boolean
  handleClose: () => void
  message: string
  torBootstrapInfo: string
}

const StartingPanelComponent: React.FC<StartingPanelComponentProps> = ({
  open,
  handleClose,
  message,
  torBootstrapInfo
}) => {
  const progressNumber = Number(torBootstrapInfo.replace(/\D/g, ''))

  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled={true}>
      <StyledGrid
        width={progressNumber * 3}
        container
        justifyContent='center'
        className={classes.root}>
        <Grid container alignItems='center' direction='column' className={classes.contentWrapper}>
          <img className={classes.image} src={QuietLogo} />

          <Grid
            container
            justifyContent='flex-start'
            alignItems='center'
            className={classes.progressBar}>
            <div className={classes.progress}></div>
          </Grid>

          <Typography variant='body2'>{`${message}: Tor ${torBootstrapInfo}`}</Typography>
          <Typography variant='body2' className={classes.text}>
            This can take some time
          </Typography>
        </Grid>
      </StyledGrid>
    </Modal>
  )
}

export default StartingPanelComponent
