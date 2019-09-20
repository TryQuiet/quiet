import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import AliceCarousel from 'react-alice-carousel'
import LinearProgress from '@material-ui/core/LinearProgress'
import Typography from '@material-ui/core/Typography'

import 'react-alice-carousel/lib/alice-carousel.css'

import Icon from '../ui/Icon'

import icon from '../../static/images/zcash/logo-lockup--circle.svg'
import carouselStrings from '../../static/text/carouselStrings.js'

const styles = theme => ({
  root: {
    width: '100vw',
    height: '100vh'
  },
  icon: {
    width: 285,
    height: 67
  },
  svg: {
    width: 100,
    height: 100
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
  progressBarContainer: {
    width: 254
  },
  progressBar: {
    backgroundColor: theme.palette.colors.lushSky
  },
  carouselContainer: {
    marginTop: 25
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
      <AliceCarousel buttonsDisabled dotsDisabled autoPlay autoPlayInterval={2000}>
        {
          carouselStrings.map((text, i) => (
            <div key={i} className={classes.tipContainer}>
              <Typography className={classes.typography} variant='caption'>{text}</Typography>
            </div>
          ))
        }
      </AliceCarousel>
    </Grid>
    <Grid className={classes.progressBarContainer} item>
      <LinearProgress className={classes.progressBar} />
    </Grid>
    <Grid className={classes.messageContainer} item>
      <Typography className={classes.message} variant='caption'>{message}</Typography>
    </Grid>
  </Grid>
)

Loading.propTypes = {
  classes: PropTypes.object.isRequired,
  message: PropTypes.string
}

export default withStyles(styles)(Loading)
