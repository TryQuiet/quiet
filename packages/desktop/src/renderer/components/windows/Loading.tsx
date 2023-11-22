import React from 'react'
import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

import 'react-alice-carousel/lib/alice-carousel.css'

import Icon from '../ui/Icon/Icon'
import icon from '../../static/images/zcash/logo-lockup--circle.svg'

const PREFIX = 'Loading'

const classes = {
    root: `${PREFIX}root`,
    icon: `${PREFIX}icon`,
    svg: `${PREFIX}svg`,
    progressBarContainer: `${PREFIX}progressBarContainer`,
    progressBar: `${PREFIX}progressBar`,
    carouselContainer: `${PREFIX}carouselContainer`,
    messageContainer: `${PREFIX}messageContainer`,
    message: `${PREFIX}message`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
    [`&.${classes.root}`]: {
        width: '100vw',
        height: '100vh',
        WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag',
    },

    [`& .${classes.icon}`]: {
        width: 285,
        height: 67,
    },

    [`& .${classes.svg}`]: {
        width: 100,
        height: 100,
    },

    [`& .${classes.progressBarContainer}`]: {
        width: 254,
    },

    [`& .${classes.progressBar}`]: {
        backgroundColor: theme.palette.colors.lushSky,
    },

    [`& .${classes.carouselContainer}`]: {
        marginTop: theme.spacing(5),
    },

    [`& .${classes.messageContainer}`]: {
        marginTop: 16,
    },

    [`& .${classes.message}`]: {
        color: theme.palette.colors.darkGray,
        fontSize: 16,
    },
}))

interface LoadingProps {
    message: string
}

export const Loading: React.FC<LoadingProps> = ({ message }) => {
    return (
        <StyledGrid className={classes.root} container direction='column' justifyContent='center' alignItems='center'>
            <Grid container item justifyContent='center'>
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
        </StyledGrid>
    )
}

export default Loading
