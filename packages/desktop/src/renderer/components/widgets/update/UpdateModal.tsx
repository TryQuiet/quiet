import React from 'react'

import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'

import Icon from '../../ui/Icon/Icon'
import updateIcon from '../../../static/images/updateIcon.svg'
import Modal from '../../ui/Modal/Modal'

const PREFIX = 'UpdateModal'

const classes = {
  info: `${PREFIX}info`,
  button: `${PREFIX}button`,
  updateIcon: `${PREFIX}updateIcon`,
  title: `${PREFIX}title`,
  subTitle: `${PREFIX}subTitle`,
  secondaryButtonContainer: `${PREFIX}secondaryButtonContainer`,
  secondaryButton: `${PREFIX}secondaryButton`,
}

const StyledModalContent = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.colors.white,
  border: 'none',

  [`& .${classes.info}`]: {
    marginTop: 38,
  },

  [`& .${classes.button}`]: {
    height: 55,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.quietBlue,
  },

  [`& .${classes.updateIcon}`]: {
    width: 102,
    height: 102,
  },

  [`& .${classes.title}`]: {
    marginTop: 24,
    marginBottom: 16,
  },

  [`& .${classes.subTitle}`]: {
    marginBottom: 32,
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

export interface UpdateModalProps {
  open: boolean
  handleClose: () => void
  handleUpdate: () => void
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ open, handleClose, handleUpdate }) => {
  return (
    <Modal open={open} handleClose={handleClose}>
      <StyledModalContent container direction='column' alignItems='center' justifyContent='flex-start'>
        <Grid className={classes.info} container justifyContent='center'>
          <Grid item>
            <Icon src={updateIcon} />
          </Grid>
        </Grid>
        <Grid container item justifyContent='center'>
          <Grid item className={classes.title}>
            <Typography variant='h3'>Software update</Typography>
          </Grid>
        </Grid>
        <Grid container item justifyContent='center'>
          <Grid item className={classes.subTitle}>
            <Typography variant='body2'>
              A new update for Quiet is available and will be applied on your next restart.
            </Typography>
          </Grid>
        </Grid>

        <Grid container spacing={8} justifyContent='center'>
          <Grid item xs={4}>
            <Button
              variant='contained'
              size='large'
              color='primary'
              type='submit'
              onClick={handleUpdate}
              fullWidth
              className={classes.button}
            >
              Restart now
            </Button>
          </Grid>
        </Grid>

        <Grid container item className={classes.secondaryButtonContainer} justifyContent='center'>
          <Button variant='contained' onClick={handleClose} size='small' fullWidth className={classes.secondaryButton}>
            Later
          </Button>
        </Grid>
      </StyledModalContent>
    </Modal>
  )
}

export default UpdateModal
