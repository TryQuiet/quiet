import React from 'react'
import { styled } from '@mui/material/styles';
import { makeStyles, Grid, Typography } from '@mui/material'
import LoadingButton from '../../ui/LoadingButton/LoadingButton'
import Modal from '../../ui/Modal/Modal'

const PREFIX = 'SentryWarningComponent';

const classes = {
  main: `${PREFIX}-main`,
  title: `${PREFIX}-title`,
  fullWidth: `${PREFIX}-fullWidth`,
  button: `${PREFIX}-button`
};

const StyledModal = styled(Modal)((
  {
    theme
  }
) => ({
  [`& .${classes.main}`]: {
    backgroundColor: theme.palette.colors.white,
    padding: '0px 32px'
  },

  [`& .${classes.title}`]: {
    marginTop: 24
  },

  [`& .${classes.fullWidth}`]: {
    paddingBottom: 25
  },

  [`& .${classes.button}`]: {
    width: 139,
    height: 60,
    backgroundColor: theme.palette.colors.purple,
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.colors.darkPurple
    },
    '&:disabled': {
      backgroundColor: theme.palette.colors.lightGray,
      color: 'rgba(255,255,255,0.6)'
    }
  }
}));

export interface SentryWarningProps {
  open: boolean
  handleClose: () => void
}

export const SentryWarningComponent: React.FC<SentryWarningProps> = ({ open, handleClose }) => {

  return (
    <StyledModal open={open} handleClose={handleClose} isCloseDisabled={true}>
      <Grid container className={classes.main} direction='column'>
        <>
          <Grid className={classes.title} item>
            <Grid item>
              <Typography variant='h4' color='error'>
                (!) Warning
              </Typography>
            </Grid>
            <Grid style={{ marginTop: '8px' }} item>
              <Typography variant='h3'>App is running in debug mode</Typography>
            </Grid>
          </Grid>
          <Grid item>
            <Typography variant='body2' color='textSecondary'>
              Some usage data may be send to centralized server for development purposes.
            </Typography>
          </Grid>
          <Grid style={{ marginTop: '24px' }} item>
            <LoadingButton
              variant='contained'
              color='primary'
              size='small'
              fullWidth
              text='Understand'
              classes={{ button: classes.button }}
              onClick={handleClose}
            />
          </Grid>
        </>
      </Grid>
    </StyledModal>
  );
}
