import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import AliceCarousel from 'react-alice-carousel'
import Typography from '@material-ui/core/Typography'

import 'react-alice-carousel/lib/alice-carousel.css'

import carouselStrings from '../../static/text/carouselStrings.js'

const styles = theme => ({
  typography: {
    color: theme.palette.colors.black,
    width: 542,
    fontSize: 24,
    textAlign: 'center'
  },
  tipContainer: {
    width: '100%',
    height: 130,
    display: 'flex',
    justifyContent: 'center'
  }
})

export const Carousel = ({ classes }) => (
  <AliceCarousel buttonsDisabled dotsDisabled autoPlay autoPlayInterval={4000}>
    {carouselStrings.map((text, i) => (
      <div key={i} className={classes.tipContainer}>
        <Typography className={classes.typography} variant='caption'>
          {text}
        </Typography>
      </div>
    ))}
  </AliceCarousel>
)

Carousel.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Carousel)
