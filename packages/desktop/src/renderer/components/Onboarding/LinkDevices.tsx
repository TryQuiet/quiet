import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, connection } from '@quiet/state-manager'
import {
  type InvitationData,
  type JoinCommunityPayload,
  type LinkDevicePayload,
  isDeviceInvitationData,
} from '@quiet/types'

import Modal from '../ui/Modal/Modal'
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

/** Title bar text per step, from the prototype's frames (2811:2575, 2811:2601, 2811:2587). */
const TITLES: Record<Step, string> = {
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
  const linkedDevices = useSelector(connection.selectors.linkedDevices)

  const linkDevicesModal = useModal(ModalName.linkDevicesModal)
  const getStartedModal = useModal(ModalName.getStartedModal)
  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const [step, setStep] = useState<Step>('entry')
  const [revealInputValue, setRevealInputValue] = useState(false)

  useEffect(() => {
    if (!linkDevicesModal.open) setStep('entry')
    if (linkDevicesModal.open && isConnected) dispatch(connection.actions.getLinkedDevices())
  }, [linkDevicesModal.open, isConnected])

  const handleBack = () => {
    if (step !== 'entry') {
      setStep('entry')
      return
    }
    if (!currentCommunity) getStartedModal.handleOpen()
    linkDevicesModal.handleClose()
  }

  const handleCommunityAction = (data: InvitationData) => {
    if (isDeviceInvitationData(data)) {
      const payload: LinkDevicePayload = { inviteData: data }
      logger.info('Linking this device from a pasted device link')
      loadingPanelModal.handleOpen()
      dispatch(communities.actions.linkDevice(payload))
      linkDevicesModal.handleClose()
      return
    }
    // A member invitation pasted here still joins, the way Join community does.
    const payload: JoinCommunityPayload = { inviteData: data }
    dispatch(communities.actions.joinCommunity(payload))
    createUsernameModal.handleOpen()
    linkDevicesModal.handleClose()
  }

  return (
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
        <LinkDevicesComponent
          onDisplayQrCode={() => setStep('display')}
          onScanQrCode={() => setStep('scan')}
          linkedDevices={linkedDevices}
        />
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
  )
}

export default LinkDevices
