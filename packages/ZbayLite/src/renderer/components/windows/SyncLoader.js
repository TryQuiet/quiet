import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { Grid, LinearProgress, Typography } from '@material-ui/core'
import { Redirect } from 'react-router'

import WindowWrapper from '../ui/WindowWrapper'
import ZcashIcon from '../../static/images/zcash/logo-lockup--circle.svg'
import Carousel from '../widgets/Carousel'
import Icon from '../ui/Icon'
import { useInterval } from '../../containers/hooks'

const styles = theme => ({
  root: {
    WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag',
    height: '100vh'
  },
  button: {
    marginLeft: 2,
    fontSize: '14px',
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  },
  info: {
    fontSize: '14px'
  },
  box: {
    height: '100vh'
  },
  icon: {
    width: 290,
    height: 100
  },
  iconDiv: {
    marginTop: theme.spacing(8)
  },
  logoContainer: {
    height: 167
  },
  progressBarContainer: {
    marginTop: theme.spacing(3),
    maxWidth: 350
  },
  progressBar: {
    backgroundColor: theme.palette.colors.linkBlue
  },
  rootBar: {
    width: 350
  },
  carouselContainer: {
    marginTop: theme.spacing(5)
  },
  status: {
    paddingTop: 8,
    width: '100%',
    fontSize: '1rem',
    color: theme.palette.colors.darkGray
  },
  statusDiv: {
    marginTop: theme.spacing(2),
    textAlign: 'center'
  },
  detailsDiv: {
    marginTop: theme.spacing(2),
    maxWidth: 350,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: 'rgb(0,0,0,0.08)',
    paddingBottom: 8
  },
  text: {
    fontSize: '1rem',
    color: theme.palette.colors.darkGray,
    textTransform: 'uppercase'
  },
  infoContainer: {
    marginTop: theme.spacing(2)
  },
  topUpInfo: {
    marginTop: 8
  }
})

export const SyncLoader = ({
  classes,
  latestBlock,
  currentBlock,
  getStatus
}) => {
  useInterval(() => {
    getStatus()
  }, 10000)
  if (currentBlock.plus(10).gt(latestBlock)) {
    return <Redirect to='/vault' />
  } else {
    return (
      <WindowWrapper className={classes.root}>
        <Grid container className={classes.box} justify='center' alignItems='center' alignContent='center'>
          <Grid
            className={classes.logoContainer}
            container
            item
            xs={12}
            justify='center'
            alignItems='center'
            alignContent='center'
          >
            <Grid item className={classes.iconDiv}>
              <Icon className={classes.icon} src={ZcashIcon}image={ZcashIcon} />
            </Grid>
          </Grid>
          <Grid className={classes.carouselContainer} container item>
            <Carousel />
          </Grid>
          <Grid item container>
            <Grid item container justify='center' alignItems='center'>
              <LinearProgress classes={{ root: classes.rootBar, barColorPrimary: classes.progressBar }} />
            </Grid>
            <Grid item xs={12} className={classes.statusDiv}>
              <Grid item container justify='center' alignItems='center' wrap={'wrap'}>
                <Typography variant='caption' className={classes.status}>
                  {`Syncing ${currentBlock} / ${latestBlock}`}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </WindowWrapper>
    )
  }
}
SyncLoader.propTypes = {
  classes: PropTypes.object.isRequired
}

SyncLoader.defaultProps = {
  nodeStatus: 'syncing'
}

export default withStyles(styles)(SyncLoader)
