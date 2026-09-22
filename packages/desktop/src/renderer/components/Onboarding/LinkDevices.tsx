import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities } from '@quiet/state-manager'
import {
  type DeviceInvitationData,
  type InvitationData,
  type JoinCommunityPayload,
  type LinkDevicePayload,
  isDeviceInvitationData,
} from '@quiet/types'

import Modal from '../ui/Modal/Modal'
import { DeviceLinkConsentComponent } from '../DeviceLinkConsent/DeviceLinkConsent'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { socketSelectors } from '../../sagas/socket/socket.selectors'
import { LinkedDevices as LinkedDevicesTab } from '../Settings/Tabs/LinkedDevices/LinkedDevices'
import { LinkDevicesComponent } from './LinkDevicesComponent'
import { PasteLinkComponent } from './PasteLinkComponent'
import { OnboardingBody } from './OnboardingBody'
import { createLogger } from '../../logger'

const logger = createLogger('LinkDevices')

type Step = 'entry' | 'display' | 'scan'

/**
 * The title the prototype's frames put in the bar (2811:2575, 2811:2601,
 * 2811:2587). Every step here draws that same words as its own large heading —
 * "Link devices", "Linked devices", "Scan QR code" — and a page with a heading
 * gets no bar title, so the bar keeps only the back glyph and these are what it
 * would have said.
 */
const HIDDEN_TITLES: Record<Step, string> = {
  entry: 'Link devices',
  display: 'QR code',
  scan: 'Scan QR code',
}

/**
 * Link devices, reached from Get started. "Display QR code" shows #3400's
 * Linked devices surface (a link can only be minted from inside a community);
 * "Scan QR code" has no camera on desktop, so it takes the pasted device link.
 */
export const LinkDevices: React.FC = () => {
  const dispatch = useDispatch()
  const isConnected = useSelector(socketSelectors.isConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)

  // `returnTo`: where the back arrow goes when this was opened from Account recovery.
  const linkDevicesModal = useModal<{ returnTo?: 'recoverAccount' }>(ModalName.linkDevicesModal)
  const joinCommunityModal = useModal<{ step?: 'recoverAccount' }>(ModalName.joinCommunityModal)
  const getStartedModal = useModal(ModalName.getStartedModal)
  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const [step, setStep] = useState<Step>('entry')
  const [revealInputValue, setRevealInputValue] = useState(false)
  const [pendingDeviceInvite, setPendingDeviceInvite] = useState<DeviceInvitationData | null>(null)

  useEffect(() => {
    if (!linkDevicesModal.open) setStep('entry')
  }, [linkDevicesModal.open])

  const handleBack = () => {
    if (step !== 'entry') {
      setStep('entry')
      return
    }
    if (linkDevicesModal.returnTo === 'recoverAccount') {
      // Opened from Account recovery → "Use linked device": back returns there.
      joinCommunityModal.handleOpen({ step: 'recoverAccount' })
      linkDevicesModal.handleClose()
      return
    }
    if (!currentCommunity) getStartedModal.handleOpen()
    linkDevicesModal.handleClose()
  }

  const handleCommunityAction = (data: InvitationData) => {
    if (isDeviceInvitationData(data)) {
      // Linking a device hands the other device this account, so it is never done without consent.
      setPendingDeviceInvite(data)
      return
    }
    // A member invitation pasted here still joins, the way Join community does.
    const payload: JoinCommunityPayload = { inviteData: data }
    dispatch(communities.actions.joinCommunity(payload))
    createUsernameModal.handleOpen()
    linkDevicesModal.handleClose()
  }

  const confirmDeviceLink = () => {
    if (!pendingDeviceInvite) return
    const payload: LinkDevicePayload = {
      inviteData: pendingDeviceInvite,
      deviceLinkConsent: true,
      confirmedQssEndpoint: pendingDeviceInvite.version === 'v5' ? pendingDeviceInvite.qssEndpoint : undefined,
    }
    logger.info('Linking this device from a pasted device link')
    loadingPanelModal.handleOpen()
    dispatch(communities.actions.linkDevice(payload))
    linkDevicesModal.handleClose()
    setPendingDeviceInvite(null)
  }

  return (
    <>
      <Modal
        open={linkDevicesModal.open}
        handleClose={linkDevicesModal.handleClose}
        title={HIDDEN_TITLES[step]}
        withoutTitle
        canGoBack
        handleBack={handleBack}
        alignCloseLeft
        contentWidth={'100%'}
        testIdPrefix={'linkDevices'}
        zIndex={1300}
      >
        {step === 'entry' ? (
          <LinkDevicesComponent onDisplayQrCode={() => setStep('display')} onScanQrCode={() => setStep('scan')} />
        ) : null}
        {step === 'display' ? (
          <OnboardingBody dataTestId='link-devices-display'>
            <LinkedDevicesTab centered />
          </OnboardingBody>
        ) : null}
        {step === 'scan' ? (
          <PasteLinkComponent
            heading={'Scan QR code'}
            intro={'Go to “Link devices” on the other device and display the QR code. Scan it to link devices.'}
            open={linkDevicesModal.open}
            isConnectionReady={isConnected}
            revealInputValue={revealInputValue}
            handleClickInputReveal={() => setRevealInputValue(value => !value)}
            handleCommunityAction={handleCommunityAction}
          />
        ) : null}
      </Modal>
      <DeviceLinkConsentComponent
        open={pendingDeviceInvite !== null}
        qssEndpoint={pendingDeviceInvite?.version === 'v5' ? pendingDeviceInvite.qssEndpoint : undefined}
        onCancel={() => setPendingDeviceInvite(null)}
        onConfirm={confirmDeviceLink}
      />
    </>
  )
}

export default LinkDevices
