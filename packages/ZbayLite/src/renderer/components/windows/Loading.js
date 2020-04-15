import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import LinearProgress from '@material-ui/core/LinearProgress'
import Typography from '@material-ui/core/Typography'

import 'react-alice-carousel/lib/alice-carousel.css'

import Icon from '../ui/Icon'
import icon from '../../static/images/zcash/logo-lockup--circle.svg'
import Carousel from '../widgets/Carousel'

const styles = theme => ({
  root: {
    width: '100vw',
    height: '100vh',
    WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag'
  },
  icon: {
    width: 285,
    height: 67
  },
  svg: {
    width: 100,
    height: 100
  },
  progressBarContainer: {
    width: 254
  },
  progressBar: {
    backgroundColor: theme.palette.colors.lushSky
  },
  carouselContainer: {
    marginTop: theme.spacing(5)
  },
  messageContainer: {
    marginTop: 16
  },
  message: {
    color: theme.palette.colors.darkGray,
    fontSize: 16
  }
})

export const Loading = ({ classes, message }) => (
  <Grid className={classes.root} container direction='column' justify='center' alignItems='center'>
    <Grid container item justify='center'>
      <Icon className={classes.icon} src={icon} />
    </Grid>
    <Grid className={classes.carouselContainer} container item>
      <Carousel />
    </Grid>
    <Grid className={classes.progressBarContainer} item>
      <LinearProgress className={classes.progressBar} />
    </Grid>
    <Grid className={classes.messageContainer} item>
      <Typography className={classes.message} variant='caption'>
        {message}
      </Typography>
    </Grid>
  </Grid>
)

Loading.propTypes = {
  classes: PropTypes.object.isRequired,
  message: PropTypes.string
}

export default withStyles(styles)(Loading)
