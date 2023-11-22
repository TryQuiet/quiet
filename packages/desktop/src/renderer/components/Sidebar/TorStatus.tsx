import React from 'react'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import { Typography } from '@mui/material'
import { connection } from '@quiet/state-manager'
import { useSelector } from 'react-redux'

const PREFIX = 'TorStatus'

const classes = {
    root: `${PREFIX}root`,
    wrapper: `${PREFIX}wrapper`,
    circleWrapper: `${PREFIX}circleWrapper`,
    circle: `${PREFIX}circle`,
}

interface StyledGridProps {
    isDev: boolean
}
const StyledGrid = styled(Grid)(({ isDev }: StyledGridProps) => ({
    [`& .${classes.root}`]: {},
    [`& .${classes.wrapper}`]: {
        paddingBottom: '32px',
        paddingLeft: '18px',
        opacity: isDev ? '100%' : '0%',
    },
    [`& .${classes.circleWrapper}`]: {
        width: '14px',
        height: '14px',
        backgroundColor: 'rgba(256,256,256,1)',
        marginLeft: '12px',
        marginBottom: '3px',
        borderRadius: '100px',
    },
    [`& .${classes.circle}`]: {
        width: '8px',
        height: '8px',
        borderRadius: '100px',
    },
}))

export interface TorStatusProps {
    isTorInitialized: boolean
}
const TorStatus = ({ isTorInitialized }: TorStatusProps) => {
    return (
        <StyledGrid isDev={process.env.NODE_ENV === 'development'} container className={classes.root}>
            <Grid container justifyContent='start' alignItems='center' className={classes.wrapper}>
                <Typography variant='body2'>TOR</Typography>
                <Grid container justifyContent='center' alignItems='center' className={classes.circleWrapper}>
                    <Grid
                        item
                        className={classes.circle}
                        style={{ background: isTorInitialized ? '#0EA02E' : '#D13135' }}
                    />
                </Grid>
            </Grid>
        </StyledGrid>
    )
}

export default TorStatus
