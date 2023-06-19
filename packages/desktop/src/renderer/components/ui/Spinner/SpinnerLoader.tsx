import React from 'react'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

const PREFIX = 'SpinnerLoader'

const classes = {
  message: `${PREFIX}message`,
  spinner: `${PREFIX}spinner`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.message}`]: {
    marginTop: theme.spacing(2),
    color: theme.palette.primary.main,
  },

  [`& .${classes.spinner}`]: (props: any) => ({
    color: props.color ? props.color : theme.palette.colors.white,
  }),
}))

interface SpinnerLoaderProps {
  message: string
  size?: number
  color?: string
  className?: string
}

interface SpinnerLoaderStylesProps {
  color?: string
}

export const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({ size = 40, message, color, className }) => {
  const stylesProps: SpinnerLoaderStylesProps = { color: color }
  return (
    <StyledGrid
      container
      justifyContent='center'
      alignItems='center'
      direction='column'
      className={className}
      data-testid={'spinnerLoader'}
    >
      <CircularProgress color='inherit' className={classes.spinner} size={size} />
      <Typography variant='caption' style={{ fontSize: `${size / 44}rem` }} className={classes.message} align='center'>
        {message}
      </Typography>
    </StyledGrid>
  )
}

export default SpinnerLoader
