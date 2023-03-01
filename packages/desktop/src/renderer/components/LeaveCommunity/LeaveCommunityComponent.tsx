import React from 'react'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import Modal from '../ui/Modal/Modal'
import Icon from '../ui/Icon/Icon'

import rocketIcon from '../../static/images/rocket.svg'

const PREFIX = 'LeaveCommunity'

const classes = {
  root: `${PREFIX}root`,
  titleContainer: `${PREFIX}titleContainer`,
  descContainer: `${PREFIX}descContainer`,
  iconContainer: `${PREFIX}iconContainer`,
  rocketIcon: `${PREFIX}rocketIcon`,
  buttonContainer: `${PREFIX}buttonContainer`,
  button: `${PREFIX}button`,
  secondaryButtonContainer: `${PREFIX}secondaryButtonContainer`,
  secondaryButton: `${PREFIX}secondaryButton`
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.root}`]: {},

  [`& .${classes.titleContainer}`]: {
    marginTop: 16
  },

  [`& .${classes.descContainer}`]: {
    marginTop: 8,
    marginLeft: 32,
    marginRight: 32,
    width: 100
  },

  [`& .${classes.iconContainer}`]: {
    marginTop: 0
  },

  [`& .${classes.rocketIcon}`]: {
    width: 120,
    height: 120,
    justifyContent: 'center'
  },

  [`& .${classes.buttonContainer}`]: {
    marginTop: 25
  },

  [`& .${classes.button}`]: {
    width: 190,
    height: 60,
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.purple,
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.colors.darkPurple
    },
    '&:disabled': {
      backgroundColor: theme.palette.colors.gray
    }
  },

  [`& .${classes.secondaryButtonContainer}`]: {
    marginTop: 16,
    marginBottom: 32
  },

  [`& .${classes.secondaryButton}`]: {
    width: 160,
    height: 40,
    color: theme.palette.colors.darkGray,
    backgroundColor: theme.palette.colors.white,
    padding: theme.spacing(2),
    '&:hover': {
      boxShadow: 'none',
      cursor: 'pointer'
    }
  }
}))

export interface LeaveCommunityProps {
  open: boolean
  handleClose: () => void
  leaveCommunity: () => void
}

export const LeaveCommunityComponent: React.FC<LeaveCommunityProps> = ({ open, handleClose, leaveCommunity }) => {
  return (
    <Modal windowed open={open} handleClose={handleClose} data-testId={'leaveCommunityModal'}>
      <StyledGrid container justifyContent='center'>
        <Grid
          container
          className={classes.iconContainer}
          item
          xs={12}
          direction='row'
          justifyContent='center'>
          <Icon className={classes.rocketIcon} src={rocketIcon} />
        </Grid>
        <Grid
          container
          item
          className={classes.titleContainer}
          xs={12}
          direction='row'
          justifyContent='center'>
          <Typography variant={'h4'}>Are you sure you want to leave?</Typography>
        </Grid>
        <Grid
          container
          item
          className={classes.descContainer}
          xs={12}
          direction='row'
          justifyContent='center'>
          <Typography align={'center'}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id semper vel quam volutpat.
          </Typography>
        </Grid>
        <Grid item xs={'auto'} className={classes.buttonContainer}>
          <Button
            variant='contained'
            onClick={leaveCommunity}
            size='small'
            fullWidth
            className={classes.button}>
            Leave community
          </Button>
        </Grid>
        <Grid
          container
          item
          className={classes.secondaryButtonContainer}
          xs={12}
          direction='row'
          justifyContent='center'>
          <Button
            variant='contained'
            onClick={handleClose}
            size='small'
            fullWidth
            className={classes.secondaryButton}>
            Never mind, I'll stay
          </Button>
        </Grid>
      </StyledGrid>
    </Modal>
  )
}
