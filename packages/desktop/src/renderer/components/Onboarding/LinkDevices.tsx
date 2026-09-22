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
import { QrScannerComponent } from './qrScanner/QrScannerComponent'
import { createLogger } from '../../logger'

const logger = createLogger('LinkDevices')

type Step = 'entry' | 'display' | 'scan' | 'paste'

/** Title bar text per step, from the prototype's frames (2811:2575, 2811:2601, 2811:2587). */
const TITLES: Record<Step, string> = {
  entry: 'Link devices',
  display: 'QR code',
  scan: 'Scan QR code',
  paste: 'Scan QR code',
}

/** The Scan QR code sheet's copy (2811:2587). */
export const SCAN_QR_CODE_INTRO =
  'Go to “Link devices” on the other device and display the QR code. Scan it to link devices.'

/**
 * Link devices, reached from Get started. "Display QR code" shows #3400's
 * Linked devices surface (a link can only be minted from inside a community);
 * "Scan QR code" opens the camera, and offers the paste field when it cannot.
 *
 * Whichever way the link arrives — scanned or pasted — linking hands the other device this
 * account, so it goes through the same consent sheet rather than starting on arrival.
 */
export const LinkDevices: React.FC = () => {
  const dispatch = useDispatch()
  const isConnected = useSelector(socketSelectors.isConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)

  const linkDevicesModal = useModal(ModalName.linkDevicesModal)
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
    if (step === 'paste') {
      setStep('scan')
      return
    }
    if (step !== 'entry') {
      setStep('entry')
      return
    }
    if (!currentCommunity) getStartedModal.handleOpen()
    linkDevicesModal.handleClose()
  }

  const handleCommunityAction = (data: InvitationData) => {
    if (isDeviceInvitationData(data)) {
      // Linking a device hands the other device this account, so it is never done without consent.
      // A scanned code is no more deliberate than a pasted one here: the camera decodes whatever is
      // in front of it, so the scan path needs the gate at least as much as the paste path does.
      setPendingDeviceInvite(data)
      return
    }
    // A member invitation here still joins, the way Join community does.
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
    logger.info('Linking this device from a device link')
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
        title={TITLES[step]}
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
          <QrScannerComponent
            intro={SCAN_QR_CODE_INTRO}
            onDecoded={handleCommunityAction}
            onUsePasteLink={() => setStep('paste')}
            dataTestId='link-devices-scanner'
          />
        ) : null}
        {step === 'paste' ? (
          <PasteLinkComponent
            heading={'Paste a link to Join'}
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
