import React from 'react'

import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { makeStyles, Theme } from '@mui/material/styles'

const useStyles = makeStyles<Theme, SpinnerLoaderStylesProps>(theme => ({
  message: {
    marginTop: theme.spacing(2),
    color: theme.palette.primary.main
  },
  spinner: props => ({
    color: props.color ? props.color : theme.palette.colors.white
  })
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

export const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({
  size = 40,
  message,
  color,
  className
}) => {
  const stylesProps: SpinnerLoaderStylesProps = { color: color }
  const classes = useStyles(stylesProps)
  return (
    <Grid container justify='center' alignItems='center' direction='column' className={className} data-testid={'spinnerLoader'}>
      <CircularProgress color='inherit' className={classes.spinner} size={size} />
      <Typography
        variant='caption'
        style={{ fontSize: `${size / 44}rem` }}
        className={classes.message}
        align='center'>
        {message}
      </Typography>
    </Grid>
  )
}

export default SpinnerLoader
