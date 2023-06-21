import React from 'react'

import { styled } from '@mui/material/styles'

import MuiSlider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import { ISliderProps } from './Slider.d'

import SliderThumb from './SliderThumb'

const PREFIX = 'Slider'

const classes = {
  sliderContainer: `${PREFIX}sliderContainer`,
  sliderRoot: `${PREFIX}sliderRoot`,
  label: `${PREFIX}label`,
  title: `${PREFIX}title`,
  iconWrapper: `${PREFIX}iconWrapper`,
  track: `${PREFIX}track`,
  thumb: `${PREFIX}thumb`,
  activated: `${PREFIX}activated`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.sliderContainer}`]: {
    width: 105,
    padding: '5px 10px',
  },

  [`& .${classes.sliderRoot}`]: {
    paddingTop: 4,
  },

  [`& .${classes.label}`]: {
    fontSize: '0.83rem',
  },

  [`& .${classes.title}`]: {
    color: theme.typography.body2.color,
    marginBottom: 8,
  },

  [`& .${classes.iconWrapper}`]: {
    width: 18,
    height: 18,
  },

  [`& .${classes.track}`]: {
    backgroundColor: '#979797',
    height: 0.5,
    opacity: 1,
  },

  [`& .${classes.thumb}`]: {
    '&:hover': {
      boxShadow: 'none',
    },
    '&$activated': {
      boxShadow: 'none',
    },
  },

  [`& .${classes.activated}`]: {
    boxShadow: 'none',
  },
}))

export const Slider: React.FC<ISliderProps> = ({ value, handleOnChange, title, minLabel, maxLabel, min, max }) => {
  return (
    <StyledGrid container direction='column' justifyContent='center' alignItems='center'>
      <Typography variant='caption' className={classes.title}>
        {title}
      </Typography>
      <Grid item>
        <Grid container direction='row'>
          <Grid item>
            <Typography variant='body2' display='inline' className={classes.label}>
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
                thumb: classes.thumb,
              }}
              components={{
                Thumb: SliderThumb,
              }}
              onChange={handleOnChange}
            />
          </Grid>
          <Grid item>
            <Typography variant='body2' display='inline' className={classes.label}>
              {maxLabel}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </StyledGrid>
  )
}

Slider.defaultProps = {
  minLabel: '$0',
  maxLabel: '$max',
  max: 100,
  min: 0,
}

export default Slider
