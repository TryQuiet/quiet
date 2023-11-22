import React from 'react'

import { styled } from '@mui/material/styles'

import { Grid, Typography } from '@mui/material'

const PREFIX = 'MessagesDivider'

const classes = {
    root: `${PREFIX}root`,
    divider: `${PREFIX}divider`,
    titleDiv: `${PREFIX}titleDiv`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
    [`& .${classes.root}`]: {
        padding: 0,
    },

    [`& .${classes.divider}`]: {
        height: 1,
        backgroundColor: theme.palette.colors.veryLightGray,
    },

    [`& .${classes.titleDiv}`]: {
        paddingLeft: 12,
        paddingRight: 12,
    },
}))

interface MessagesDividerProps {
    title: string
}

export const MessagesDivider: React.FC<MessagesDividerProps> = ({ title }) => {
    return (
        <StyledGrid container justifyContent='center' alignItems='center'>
            <Grid item xs>
                <div className={classes.divider} />
            </Grid>
            <Grid item className={classes.titleDiv}>
                <Typography variant='body1'>{title}</Typography>
            </Grid>
            <Grid item xs>
                <div className={classes.divider} />
            </Grid>
        </StyledGrid>
    )
}

export default MessagesDivider
