import React, { useState } from 'react'

import { styled } from '@mui/material/styles'
import { useDispatch } from 'react-redux'

import { Grid, IconButton, Tabs } from '@mui/material'
import TextWithLink from '../../../ui/TextWithLink/TextWithLink'

import Modal from '../../../ui/Modal/Modal'
import Tab from '../../../ui/Tab/Tab'
import { Typography, Button } from '@mui/material'
import { LoadingButton } from '../../../ui/LoadingButton/LoadingButton'
import { app } from '@quiet/state-manager'


const PREFIX = 'PerformCommunityActionComponent'

const classes = {
  focus: `${PREFIX}focus`,
  margin: `${PREFIX}margin`,
  error: `${PREFIX}error`,
  fullContainer: `${PREFIX}fullContainer`,
  gutter: `${PREFIX}gutter`,
  button: `${PREFIX}button`,
  title: `${PREFIX}title`,
  iconDiv: `${PREFIX}iconDiv`,
  warrningIcon: `${PREFIX}warrningIcon`,
  warrningMessage: `${PREFIX}warrningMessage`,
  rootBar: `${PREFIX}rootBar`,
  progressBar: `${PREFIX}progressBar`,
  info: `${PREFIX}info`
}

const StyledModalContent = styled(Grid)((
  {
    theme
  }
) => ({
  backgroundColor: theme.palette.colors.white,
  padding: '0px 32px',

  [`& .${classes.fullContainer}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center'
  },

  [`& .${classes.gutter}`]: {
    marginTop: 8,
  },

  [`& .${classes.title}`]: {
    marginBottom: 13,
  },

  [`& .${classes.button}`]: {
    width: 165,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue
    },
    textTransform: 'none',
    height: 48,
    fontWeight: 'normal',
    marginTop: '30px'
  }
}))


interface LeaveCommunityModalProps {
  communityName: string
  open: boolean
  handleClose: () => void
}

export const LeaveCommunityModal: React.FC<LeaveCommunityModalProps> = ({ communityName, open, handleClose }) => {
  const dispatch = useDispatch()

  const handleLeaveConfirm = () => {
    dispatch(app.actions.leaveCommunity)
  }

  return (
    <Modal open={open} handleClose={handleClose} testIdPrefix='leave community' isBold fullPage={false}>
      <StyledModalContent container direction='column'>

        <Grid
          container
          justifyContent='flex-start'
          direction='column'
          className={classes.fullContainer}>
          <Typography variant='h4' className={classes.title}>
            Are you sure you want to leave?
          </Typography>
          <Typography variant='h6' align='center'>
            If you confirm, you will lose all data related to community <b>{communityName}</b>
          </Typography>

          <LoadingButton
            type='submit'
            variant='contained'
            size='small'
            color='primary'
            fullWidth
            text={'Leave community'}
            classes={{ button: classes.button }}
            disabled={false}
            onClick={handleLeaveConfirm}
          />

          <div className={classes.gutter}>
            <Grid container alignItems='center' direction='row'>
              <TextWithLink
                links={[{
                  tag: 'link',
                  action: handleClose,
                  label: `Never mind, I'll stay`
                }]}
                text={' %link'}
              />
            </Grid>
          </div>
        </Grid>

      </StyledModalContent>
    </Modal >
  )
}

export default LeaveCommunityModal
