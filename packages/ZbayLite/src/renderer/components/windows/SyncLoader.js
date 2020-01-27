import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { Grid, LinearProgress, Typography } from '@material-ui/core'
import Immutable from 'immutable'

import WindowWrapper from '../ui/WindowWrapper'
import ZcashIcon from '../../static/images/zcash/logo-lockup--circle.svg'
import Carousel from '../widgets/Carousel'
import Icon from '../ui/Icon'

const styles = theme => ({
  root: {
    WebkitAppRegion: 'drag',
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

export const SyncLoader = ({ classes, hasAddress, blockchainStatus, node, bootstrapping, bootstrappingMessage, nodeConnected, openModal, fetchingStatus, fetchingSizeLeft, fetchingPart, fetchingSpeed, fetchingEndTime }) => {
  const lastBlock = node.latestBlock.isEqualTo(0) ? 999999 : node.latestBlock
  const sync = parseFloat(node.currentBlock.div(lastBlock) * 100).toFixed(2)
  const fetching = (((20602539059 - fetchingSizeLeft) * 100) / 20602539059).toFixed()
  let ETA = null
  if (fetchingEndTime) {
    const { hours, minutes } = fetchingEndTime
    ETA = `${hours ? `${hours}h` : ''} ${minutes ? `${minutes}m` : ''} left`
  }
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
            <LinearProgress variant={'determinate'} classes={{ root: classes.rootBar, barColorPrimary: classes.progressBar }} value={nodeConnected ? sync : fetching} />
          </Grid>
          <Grid item xs={12} className={classes.statusDiv}>
            {bootstrapping ? <Typography variant='caption' className={classes.status}>
              {`${bootstrappingMessage}`}
            </Typography> : fetchingStatus !== 'SUCCESS' && blockchainStatus !== 'SUCCESS' ? (
              <Grid item container justify='center' alignItems='center' wrap={'wrap'}>
                <Typography variant='caption' className={classes.status}>
                  {`Syncing, ${ETA || ''} (${(fetchingSpeed / 1024 ** 2).toFixed(2)} MB/s)`}
                </Typography>
              </Grid>
            ) : <Typography variant='caption' className={classes.status}>
              {`${node.connections.toString()} Connections. Fetching block ${node.currentBlock} / ~${lastBlock}`}
            </Typography>}
          </Grid>
        </Grid>
        {hasAddress && (
          <Grid item container direction={'row'} justify={'center'} className={classes.topUpInfo}>
            <Typography className={classes.info} variant={'caption'} onClick={openModal}>{`Your node is ready to receive funds! Want to save time later?`}</Typography>
            <Typography className={classes.button} variant={'caption'} onClick={openModal}>Add funds now</Typography>
          </Grid>
        )}
      </Grid>
    </WindowWrapper>
  )
}

SyncLoader.propTypes = {
  classes: PropTypes.object.isRequired,
  node: PropTypes.instanceOf(Immutable.Record).isRequired
}

export default withStyles(styles)(SyncLoader)
