import React, { ReactElement } from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Icon from '../../ui/Icon/Icon'
import updateIcon from '../../../static/images/updateIcon.svg'
import Modal from '../../ui/Modal/Modal'

const PREFIX = 'UpdateModal'

const classes = {
  updateIcon: `${PREFIX}-updateIcon`,
  title: `${PREFIX}-title`,
  message: `${PREFIX}-message`,
}

const StyledModalContent = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  border: 'none',
  marginTop: '-60px',

  [`& .${classes.updateIcon}`]: {
    width: 102,
    height: 102,
  },

  [`& .${classes.title}`]: {
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },

  [`& .${classes.message}`]: {
    marginBottom: 32,
    textAlign: 'center',
  },
}))

export interface UpdateModalProps {
  open: boolean
  handleClose: () => void
  buttons: ReactElement[]
  title: string
  message: string
}

export const UpdateModalComponent: React.FC<UpdateModalProps> = ({ open, handleClose, buttons, title, message }) => {
  return (
    <Modal open={open} handleClose={handleClose} data-testid={'updateAppModal'}>
      <StyledModalContent container direction='column' alignItems='center' justifyContent='center'>
        <Grid>
          <Icon src={updateIcon} />
        </Grid>
        <Grid className={classes.title}>
          <Typography variant='h3'>{title}</Typography>
        </Grid>
        <Grid className={classes.message}>
          <Typography variant='body2'>{message}</Typography>
        </Grid>
        <Grid container direction='column' alignItems='center' spacing={2}>
          {buttons.map((button, index) => (
            <Grid item xs={4} key={index}>
              {button}
            </Grid>
          ))}
        </Grid>
      </StyledModalContent>
    </Modal>
  )
}

export default UpdateModalComponent
