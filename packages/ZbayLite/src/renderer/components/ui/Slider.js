import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import MuiSlider from '@material-ui/lab/Slider'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import SliderThumb from './SliderThumb'

const styles = theme => ({
  sliderContainer: {
    width: 105,
    padding: '5px 10px'
  },
  sliderRoot: {
    paddingTop: 4
  },
  label: {
    fontSize: '0.83rem'
  },
  title: {
    color: theme.typography.body2.color,
    marginBottom: 8
  },
  iconWrapper: {
    width: 18,
    height: 18
  },
  track: {
    backgroundColor: '#979797',
    height: 0.5,
    opacity: 1
  },
  thumb: {
    '&:hover': {
      boxShadow: 'none'
    },
    '&$activated': {
      boxShadow: 'none'
    }
  },
  activated: {
    boxShadow: 'none'
  }
})

export const Slider = ({
  classes,
  value,
  handleOnChange,
  title,
  minLabel,
  maxLabel,
  min,
  max
}) => (
  <Grid container direction='column' justify='center' alignItems='center'>
    <Typography variant='caption' className={classes.title}>
      {title}
    </Typography>
    <Grid item>
      <Grid container direction='row'>
        <Grid item>
          <Typography variant='body2' inline className={classes.label}>
            {minLabel}
          </Typography>
        </Grid>
        <Grid item xs className={classes.sliderContainer}>
          <MuiSlider
            value={value}
            min={min}
            max={max}
            classes={{
              root: classes.sliderRoot,
              activated: classes.activated,
              thumbIconWrapper: classes.iconWrapper,
              track: classes.track,
              thumb: classes.thumb,
              trackBefore: classes.track,
              trackAfter: classes.track
            }}
            thumb={<SliderThumb />}
            onChange={handleOnChange}
          />
        </Grid>
        <Grid item>
          <Typography variant='body2' inline className={classes.label}>
            {maxLabel}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  </Grid>
)

Slider.propTypes = {
  classes: PropTypes.object.isRequired,
  value: PropTypes.number.isRequired,
  handleOnChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  minLabel: PropTypes.string.isRequired,
  maxLabel: PropTypes.string.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired
}

Slider.defaultProps = {
  minLabel: '$0',
  maxLabel: '$max',
  max: 100,
  min: 0
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(Slider)
