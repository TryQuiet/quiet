import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import { useModal } from '../../containers/hooks'
import { modalsActions } from '../../sagas/modals/modals.slice'
import { ModalName } from '../../sagas/modals/modals.types'
import { AgreeAndJoinCard } from '../Onboarding/AgreeAndJoinCard'
import { useDispatch } from 'react-redux'
import type { DeviceLinkConsentArgs, DeviceLinkConsentComponentProps } from './DeviceLinkConsent.types'

const PREFIX = 'DeviceLinkConsent-'
const classes = {
  info: `${PREFIX}info`,
}

const Body = styled(Typography)({
  [`&.${classes.info}`]: {
    textAlign: 'left',
  },
}) as typeof Typography

/**
 * The "use Quiet's server?" step, as the design draws it: the Agree & join card
 * (3054:4090), full-window — a titled bar, a left-aligned
 * body naming the host, and one pill. The back arrow is the way out and every
 * caller maps it to declining.
 *
 * The body is not the terms copy. Linking a device hands the other device this
 * account, and when the invite carries a QSS endpoint the app contacts that
 * host directly, so the copy says what that exposes. Wording is develop's,
 * unchanged.
 */
export const DeviceLinkConsentComponent = ({
  open,
  qssEndpoint,
  onCancel,
  onConfirm,
}: DeviceLinkConsentComponentProps) => (
  <AgreeAndJoinCard
    open={open}
    handleClose={onCancel}
    onAgree={onConfirm}
    agreeLabel='Link device'
    testIdPrefix='deviceLinkConsent'
    bodyTestId='device-link-consent'
    agreeTestId='confirm-device-link'
  >
    <Body variant='body2' className={classes.info}>
      {qssEndpoint ? (
        <>
          Quiet will contact <strong data-testid='device-link-endpoint'>{qssEndpoint}</strong> directly. That server can
          see your IP address. Continue only if you trust this endpoint and the person who shared the link.
        </>
      ) : (
        <>
          Quiet will connect to the linked device over Tor. Continue only if you trust the person who shared the link.
        </>
      )}
    </Body>
  </AgreeAndJoinCard>
)

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
