import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import CardMedia from '@material-ui/core/CardMedia'
import AliceCarousel from 'react-alice-carousel'
import { Grid, LinearProgress, Typography } from '@material-ui/core'
import Immutable from 'immutable'

import WindowWrapper from '../ui/WindowWrapper'
import ZcashIcon from '../../static/images/zcash/zbay-icon.svg'
import ZcashIconGray from '../../static/images/zcash/zbay-icon-gray.svg'
import carouselStrings from '../../static/text/carouselStrings.js'

const SIZE = 250

const styles = theme => ({
  root: {},
  icon: {
    width: SIZE,
    height: SIZE
  },
  icongray: {
    width: SIZE,
    height: SIZE
  },
  iconDiv: {
    marginTop: theme.spacing(8)
  },
  progressBarContainer: {
    marginTop: theme.spacing(3),
    maxWidth: 350
  },
  progressBar: {
    backgroundColor: theme.palette.colors.lushSky,
    width: 350
  },
  typography: {
    color: theme.palette.colors.black,
    width: 542,
    fontSize: 24,
    textAlign: 'center'
  },
  tipContainer: {
    width: '100%',
    height: 100,
    display: 'flex',
    justifyContent: 'center'
  },
  carouselContainer: {
    marginTop: theme.spacing(5)
  },
  status: {
    fontSize: '1.4rem',
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
  }
})

export const SyncLoader = ({ classes, node }) => {
  const sync = parseFloat(node.currentBlock.div(node.latestBlock) * 100).toFixed(2)
  const loaded = (sync * SIZE) / 100
  return (
    <WindowWrapper className={classes.root}>
      <Grid container justify='center' alignItems='center'>
        <Grid item container justify='center' alignItems='center' direction='column'>
          <Grid item className={classes.iconDiv}>
            <div style={{ maxHeight: SIZE - loaded, overflow: 'hidden' }}>
              <CardMedia image={ZcashIconGray} className={classes.icongray} />
            </div>
            <div style={{ maxHeight: loaded, overflow: 'hidden' }}>
              <CardMedia
                image={ZcashIcon}
                style={{ marginTop: -SIZE + loaded }}
                className={classes.icon}
              />
            </div>
          </Grid>
        </Grid>
        <Grid className={classes.carouselContainer} container item>
          <AliceCarousel buttonsDisabled dotsDisabled autoPlay autoPlayInterval={2000}>
            {carouselStrings.map((text, key) => (
              <div key={key} className={classes.tipContainer}>
                <Typography className={classes.typography} variant='caption'>
                  {text}
                </Typography>
              </div>
            ))}
          </AliceCarousel>
        </Grid>
        <Grid item container justify='center' alignItems='center'>
          <LinearProgress className={classes.progressBar} />
        </Grid>
        <Grid item xs={12} className={classes.statusDiv}>
          <Typography variant='caption' className={classes.status}>
            Syncing {sync}%
          </Typography>
        </Grid>
        <Grid
          item
          container
          justify='center'
          alignItems='center'
          direction='column'
          className={classes.infoContainer}
        >
          <Grid item container justify='space-between' className={classes.detailsDiv}>
            <Typography className={classes.text}>{'network'}</Typography>
            <Typography className={classes.text}>
              {node.isTestnet ? 'testnet' : 'mainnet'}
            </Typography>
          </Grid>
          <Grid item container justify='space-between' className={classes.detailsDiv}>
            <Typography className={classes.text}>{'blocks'}</Typography>
            <Typography
              className={classes.text}
            >{`${node.currentBlock.toString()} / ~${node.latestBlock.toString()}`}</Typography>
          </Grid>
          <Grid item container justify='space-between' className={classes.detailsDiv}>
            <Typography className={classes.text}>{'connections'}</Typography>
            <Typography className={classes.text}>{node.connections.toString()}</Typography>
          </Grid>
        </Grid>
      </Grid>
    </WindowWrapper>
  )
}

SyncLoader.propTypes = {
  classes: PropTypes.object.isRequired,
  node: PropTypes.instanceOf(Immutable.Record).isRequired
}

export default withStyles(styles)(SyncLoader)
