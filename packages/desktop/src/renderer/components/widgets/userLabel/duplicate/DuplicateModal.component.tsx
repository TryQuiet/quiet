import React from 'react'
import Modal from '../../../ui/Modal/Modal'
import { Grid, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import WarnIcon from '../../../../static/images/exclamationMark.svg'
import UserLabel from '../UserLabel.component'
import { UserLabelType } from '../UserLabel.types'

const PREFIX = 'UserDuplicateModalComponent-'

const classes = {
    bodyText: `${PREFIX}bodyText`,
    image: `${PREFIX}image`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
    [`& .${classes.bodyText}`]: {
        textAlign: 'center',
        width: '60%',
        margin: '24px 0 4px',
    },
    [`& .${classes.image}`]: {
        width: '70px',
        height: '70px',
        margin: '30px 0 24px',
    },
}))

export interface DuplicateModalComponentProps {
    open: boolean
    handleClose: () => void
}

const DuplicateModalComponent: React.FC<DuplicateModalComponentProps> = ({ handleClose, open }) => {
    return (
        <Modal
            open={open}
            handleClose={handleClose}
            data-testid={'duplicateModalComponent'}
            title={'Warning!'}
            isBold
            addBorder
        >
            <StyledGrid container item direction='column' justifyContent='flex-start' alignItems='center'>
                <img className={classes.image} src={WarnIcon} />
                <Typography variant='h3'>Multiple users with same name</Typography>
                <Typography className={classes.bodyText} variant='body2'>
                    An unregistered user is using the same name as another user. This should be rare, and could mean
                    someone is impersonating another user.
                    <br />
                    <br />
                    These users will be marked
                </Typography>
                <UserLabel type={UserLabelType.DUPLICATE} username={''} />
            </StyledGrid>
        </Modal>
    )
}

export default DuplicateModalComponent
