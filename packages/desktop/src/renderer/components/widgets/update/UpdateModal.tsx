import React from 'react'

import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'

import Icon from '../../ui/Icon/Icon'
import updateIcon from '../../../static/images/updateIcon.svg'
import Modal from '../../ui/Modal/Modal'

const PREFIX = 'UpdateModal';

const classes = {
  root: `${PREFIX}-root`,
  info: `${PREFIX}-info`,
  button: `${PREFIX}-button`,
  updateIcon: `${PREFIX}-updateIcon`,
  title: `${PREFIX}-title`,
  subTitle: `${PREFIX}-subTitle`
};

const StyledModal = styled(Modal)((
  {
    theme
  }
) => ({
  [`& .${classes.root}`]: {
    backgroundColor: theme.palette.colors.white,
    border: 'none'
  },

  [`& .${classes.info}`]: {
    marginTop: 38
  },

  [`& .${classes.button}`]: {
    height: 55,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.quietBlue
  },

  [`& .${classes.updateIcon}`]: {
    width: 102,
    height: 102
  },

  [`& .${classes.title}`]: {
    marginTop: 24,
    marginBottom: 16
  },

  [`& .${classes.subTitle}`]: {
    marginBottom: 32
  }
}));

interface UpdateModalProps {
  open: boolean
  handleClose: () => void
  handleUpdate: () => void
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ open, handleClose, handleUpdate }) => {

  return (
    <StyledModal open={open} handleClose={handleClose}>
      <Grid container direction='column' className={classes.root} alignItems='center' justifyContent='flex-start'>
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
            <Typography variant='body2'>An update is available for Quiet.</Typography>
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
              Update now
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </StyledModal>
  );
}

export default UpdateModal
