import React from 'react'
import { makeStyles } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

import 'react-alice-carousel/lib/alice-carousel.css'

import Icon from '../ui/Icon/Icon'
import icon from '../../static/images/zcash/logo-lockup--circle.svg'

const useStyles = makeStyles((theme) => ({
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
}))

interface LoadingProps {
  message: string
}

export const Loading: React.FC<LoadingProps> = ({ message }) => {
  const classes = useStyles({})
  return (
    <Grid className={classes.root} container direction='column' justify='center' alignItems='center'>
      <Grid container item justify='center'>
        <Icon className={classes.icon} src={icon} />
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
}

export default Loading
