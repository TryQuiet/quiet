import React from 'react'
import { Button, Grid, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'

import { useModal } from '../../containers/hooks'
import { modalsActions } from '../../sagas/modals/modals.slice'
import { ModalName } from '../../sagas/modals/modals.types'
import Modal from '../ui/Modal/Modal'
import { useDispatch } from 'react-redux'
import type { DeviceLinkConsentArgs, DeviceLinkConsentComponentProps } from './DeviceLinkConsent.types'

const PREFIX = 'DeviceLinkConsent-'
const classes = {
  contentWrap: `${PREFIX}contentWrap`,
  textWrap: `${PREFIX}textWrap`,
  actionsWrap: `${PREFIX}actionsWrap`,
  info: `${PREFIX}info`,
  confirmButton: `${PREFIX}confirmButton`,
  cancelButton: `${PREFIX}cancelButton`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  textAlign: 'center',
  justifyContent: 'center',

  [`&.${classes.contentWrap}`]: {
    width: '100%',
    flex: 1,
    display: 'flex',
    gap: theme.spacing(3),
    padding: theme.spacing(0, 4),
    alignItems: 'center',
    justifyContent: 'center',
  },

  [`& .${classes.textWrap}`]: {
    padding: theme.spacing(0, 3),
    gap: theme.spacing(2),
  },

  [`& .${classes.actionsWrap}`]: {
    gap: theme.spacing(2),
  },

  [`& .${classes.info}`]: {
    maxWidth: 520,
    color: theme.palette.text.secondary,
    ...theme.typography.body2,
  },

  [`& .${classes.confirmButton}`]: {
    height: '50px',
    padding: theme.spacing(1.5, 2.5),
    width: 'auto',
    ...theme.typography.body1,
  },

  [`& .${classes.cancelButton}`]: {
    minWidth: '62px',
    padding: 0,
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
  },
}))

export const DeviceLinkConsentComponent = ({
  open,
  qssEndpoint,
  onCancel,
  onConfirm,
}: DeviceLinkConsentComponentProps) => {
  return (
    <Modal open={open} handleClose={onCancel} isCloseDisabled={true} withoutHeader={true}>
      <StyledGrid
        container
        direction='column'
        alignItems='center'
        className={classes.contentWrap}
        data-testid='device-link-consent'
      >
        <StyledGrid container direction='column' alignItems='center' className={classes.textWrap}>
          <Grid item>
            <Typography variant='h3'>Link this device?</Typography>
          </Grid>
          <Grid item>
            {qssEndpoint ? (
              <Typography className={classes.info}>
                Quiet will contact <strong data-testid='device-link-endpoint'>{qssEndpoint}</strong> directly. That
                server can see your IP address. Continue only if you trust this endpoint and the person who shared the
                link.
              </Typography>
            ) : (
              <Typography className={classes.info}>
                Quiet will connect to the linked device over Tor. Continue only if you trust the person who shared the
                link.
              </Typography>
            )}
          </Grid>
        </StyledGrid>
        <StyledGrid container direction='column' alignItems='center' className={classes.actionsWrap}>
          <Grid item>
            <Button
              variant='contained'
              className={classes.confirmButton}
              onClick={onConfirm}
              data-testid='confirm-device-link'
              size='large'
            >
              Link device
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='text'
              className={classes.cancelButton}
              onClick={onCancel}
              data-testid='cancel-device-link'
              size='small'
            >
              No thanks
            </Button>
          </Grid>
        </StyledGrid>
      </StyledGrid>
    </Modal>
  )
}

const DeviceLinkConsent = () => {
  const dispatch = useDispatch()
  const { open, handleClose, qssEndpoint } = useModal<DeviceLinkConsentArgs>(ModalName.deviceLinkConsent)

  return (
    <DeviceLinkConsentComponent
      open={open}
      qssEndpoint={qssEndpoint}
      onCancel={() => {
        dispatch(modalsActions.cancelDeviceLinkConsent())
        handleClose()
      }}
      onConfirm={() => dispatch(modalsActions.confirmDeviceLinkConsent())}
    />
  )
}

export default DeviceLinkConsent
