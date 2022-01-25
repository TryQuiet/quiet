import React from 'react'

import MuiSlider from '@material-ui/core/Slider'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import { ISliderProps } from './Slider.d'

import SliderThumb from './SliderThumb'

const useStyles = makeStyles((theme) => ({
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
}))

export const Slider: React.FC<ISliderProps> = ({
  value,
  handleOnChange,
  title,
  minLabel,
  maxLabel,
  min,
  max
}) => {
  const classes = useStyles({})
  return (
    <Grid container direction="column" justify="center" alignItems="center">
      <Typography variant="caption" className={classes.title}>
        {title}
      </Typography>
      <Grid item>
        <Grid container direction="row">
          <Grid item>
            <Typography
              variant="body2"
              display="inline"
              className={classes.label}
            >
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
                track: classes.track,
                thumb: classes.thumb
              }}
              ThumbComponent={SliderThumb}
              onChange={handleOnChange}
            />
          </Grid>
          <Grid item>
            <Typography
              variant="body2"
              display="inline"
              className={classes.label}
            >
              {maxLabel}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

Slider.defaultProps = {
  minLabel: '$0',
  maxLabel: '$max',
  max: 100,
  min: 0
}

export default Slider
