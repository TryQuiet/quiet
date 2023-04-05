import React from 'react'

import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'

import Icon from '../../ui/Icon/Icon'
import updateIcon from '../../../static/images/updateIcon.svg'
import Modal from '../../ui/Modal/Modal'

const PREFIX = 'WarningModal'

const classes = {
  info: `${PREFIX}info`,
  button: `${PREFIX}button`,
  updateIcon: `${PREFIX}updateIcon`,
  title: `${PREFIX}title`,
  subTitle: `${PREFIX}subTitle`
}

const StyledModalContent = styled(Grid)((
  {
    theme
  }
) => ({
  backgroundColor: theme.palette.colors.white,
  border: 'none',

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
}))

export interface WarningModalComponentProps {
  open: boolean
  handleClose: () => void
  title?: string
  subtitle?: string
}

export const WarningModalComponent: React.FC<WarningModalComponentProps> = ({ open, handleClose, title, subtitle }) => {
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
            {title && <Typography variant='h3'>{title}</Typography>}
          </Grid>
        </Grid>
        <Grid container item justifyContent='center'>
          <Grid item className={classes.subTitle}>
           {subtitle && <Typography variant='body2'>{subtitle}</Typography>}
          </Grid>
        </Grid>
        <Grid container spacing={8} justifyContent='center'>
          <Grid item xs={4}>
            <Button
              variant='contained'
              size='large'
              color='primary'
              type='submit'
              onClick={handleClose}
              fullWidth
              className={classes.button}
            >
              Continue
            </Button>
          </Grid>
        </Grid>
      </StyledModalContent>
    </Modal>
  )
}

export default WarningModalComponent
