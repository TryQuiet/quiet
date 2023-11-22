import React from 'react'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import { useModal } from '../../../containers/hooks'
import Modal from '../../ui/Modal/Modal'

const PREFIX = 'DeleteChannel'

const classes = {
    root: `${PREFIX}root`,
    titleContainer: `${PREFIX}titleContainer`,
    descContainer: `${PREFIX}descContainer`,
    iconContainer: `${PREFIX}iconContainer`,
    buttonContainer: `${PREFIX}buttonContainer`,
    button: `${PREFIX}button`,
    secondaryButtonContainer: `${PREFIX}secondaryButtonContainer`,
    secondaryButton: `${PREFIX}secondaryButton`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
    padding: '0px 32px',

    [`& .${classes.root}`]: {},

    [`& .${classes.titleContainer}`]: {
        marginTop: 16,
    },

    [`& .${classes.descContainer}`]: {
        marginTop: 8,
        marginLeft: 32,
        marginRight: 32,
        width: 100,
    },

    [`& .${classes.iconContainer}`]: {
        marginTop: 0,
    },

    [`& .${classes.buttonContainer}`]: {
        marginTop: 25,
    },

    [`& .${classes.button}`]: {
        width: 190,
        height: 60,
        color: theme.palette.colors.white,
        backgroundColor: theme.palette.colors.purple,
        padding: theme.spacing(2),
        '&:hover': {
            backgroundColor: theme.palette.colors.darkPurple,
        },
        '&:disabled': {
            backgroundColor: theme.palette.colors.gray,
        },
    },

    [`& .${classes.secondaryButtonContainer}`]: {
        marginTop: 16,
        marginBottom: 32,
    },

    [`& .${classes.secondaryButton}`]: {
        width: 160,
        height: 40,
        color: theme.palette.colors.darkGray,
        backgroundColor: theme.palette.colors.white,
        padding: theme.spacing(2),
        '&:hover': {
            boxShadow: 'none',
            cursor: 'pointer',
            backgroundColor: theme.palette.colors.white,
        },
    },
}))

export interface DeleteChannelProps {
    channelName: string
    deleteChannel: () => void
}

export const DeleteChannelComponent: React.FC<ReturnType<typeof useModal> & DeleteChannelProps> = ({
    open,
    handleClose,
    channelName,
    deleteChannel,
}) => {
    return (
        <Modal open={open} handleClose={handleClose} fullPage={false}>
            <StyledGrid container justifyContent='center'>
                <Grid container item className={classes.titleContainer} xs={12} direction='row' justifyContent='center'>
                    <Typography variant={'h4'}>Are you sure?</Typography>
                </Grid>
                <Grid container item className={classes.descContainer} xs={12} direction='row' justifyContent='center'>
                    <Typography align={'center'}>
                        Delete <span style={{ fontWeight: 500 }}>#{channelName}</span>? This cannot be undone.
                    </Typography>
                </Grid>
                <Grid item xs={'auto'} className={classes.buttonContainer}>
                    <Button
                        variant='contained'
                        onClick={deleteChannel}
                        size='small'
                        fullWidth
                        className={classes.button}
                        data-testid='deleteChannelButton'
                    >
                        Delete channel
                    </Button>
                </Grid>
                <Grid
                    container
                    item
                    className={classes.secondaryButtonContainer}
                    xs={12}
                    direction='row'
                    justifyContent='center'
                >
                    <Button
                        variant='contained'
                        onClick={handleClose}
                        size='small'
                        fullWidth
                        className={classes.secondaryButton}
                    >
                        Never mind
                    </Button>
                </Grid>
            </StyledGrid>
        </Modal>
    )
}

export default DeleteChannelComponent
