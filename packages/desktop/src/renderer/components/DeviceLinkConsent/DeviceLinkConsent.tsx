import React from 'react'
import { Button, Grid, Typography } from '@mui/material'

import { useModal } from '../../containers/hooks'
import { modalsActions } from '../../sagas/modals/modals.slice'
import { ModalName } from '../../sagas/modals/modals.types'
import Modal from '../ui/Modal/Modal'
import { useDispatch } from 'react-redux'
import type { DeviceLinkConsentArgs, DeviceLinkConsentComponentProps } from './DeviceLinkConsent.types'

export const DeviceLinkConsentComponent = ({
  open,
  qssEndpoint,
  onCancel,
  onConfirm,
}: DeviceLinkConsentComponentProps) => {
  return (
    <Modal open={open} handleClose={onCancel} zIndex={1400}>
      <Grid container direction='column' spacing={3} data-testid='device-link-consent'>
        <Grid item>
          <Typography variant='h3'>Link this device?</Typography>
        </Grid>
        <Grid item>
          {qssEndpoint ? (
            <Typography variant='body2'>
              Quiet will contact <strong data-testid='device-link-endpoint'>{qssEndpoint}</strong> directly. That server
              can see your IP address. Continue only if you trust this endpoint and the person who shared the link.
            </Typography>
          ) : (
            <Typography variant='body2'>
              Quiet will connect to the linked device over Tor. Continue only if you trust the person who shared the
              link.
            </Typography>
          )}
        </Grid>
        <Grid item container spacing={2} justifyContent='flex-end'>
          <Grid item>
            <Button onClick={onCancel} data-testid='cancel-device-link'>
              Cancel
            </Button>
          </Grid>
          <Grid item>
            <Button variant='contained' onClick={onConfirm} data-testid='confirm-device-link'>
              Link device
            </Button>
          </Grid>
        </Grid>
      </Grid>
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
