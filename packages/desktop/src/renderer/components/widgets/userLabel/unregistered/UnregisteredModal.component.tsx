import { Button, Grid, Typography } from '@mui/material'
import React from 'react'
import Modal from '../../../ui/Modal/Modal'
import { styled } from '@mui/material/styles'

const PREFIX = 'UnregisteredModalComponent-'

const classes = {
    bodyText: `${PREFIX}bodyText`,
    button: `${PREFIX}button`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
    [`& .${classes.bodyText}`]: {
        textAlign: 'center',
        width: '60%',
        margin: '30px 0 4px',
    },

    [`& .${classes.button}`]: {
        marginTop: 24,
        textTransform: 'none',
        padding: '0 24px',
        height: 60,
        borderRadius: '8px',
        color: theme.palette.colors.white,
        backgroundColor: theme.palette.colors.quietBlue,
        '&:hover': {
            opacity: 0.7,
            backgroundColor: theme.palette.colors.quietBlue,
        },
    },
}))

export interface UnregisteredModalComponentProps {
    open: boolean
    handleClose: () => void
    username: string
}
const UnregisteredModalComponent: React.FC<UnregisteredModalComponentProps> = ({ handleClose, open, username }) => {
    return (
        <Modal
            open={open}
            handleClose={handleClose}
            data-testid={'unregisteredModalComponent'}
            title={'Unregistered username'}
            isBold
            addBorder
        >
            <StyledGrid container item direction='column' justifyContent='flex-start' alignItems='center'>
                <Typography className={classes.bodyText} variant='body2'>
                    The username <strong>@{username}</strong> has not been registered yet with the community owner, so
                    it’s still possible for someone else to register the same username. When the community owner is
                    online, <strong>@{username}</strong> will be registered automatically and this alert will go away.
                </Typography>
                <Button className={classes.button} data-testid='unregistered-button' onClick={handleClose}>
                    OK
                </Button>
            </StyledGrid>
        </Modal>
    )
}

export default UnregisteredModalComponent
