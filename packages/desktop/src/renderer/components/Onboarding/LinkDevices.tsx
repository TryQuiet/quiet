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
import { DisplayQrCode } from './DisplayQrCode'
import { LinkDevicesComponent } from './LinkDevicesComponent'
import { PasteLinkComponent } from './PasteLinkComponent'
import { QrScannerComponent } from './qrScanner/QrScannerComponent'
import { createLogger } from '../../logger'

const logger = createLogger('LinkDevices')

/** `paste` is the scanner's fallback (back returns to the camera); `pasteLink` is the Paste link row's (back returns here). */
export type LinkDevicesStep = 'entry' | 'display' | 'scan' | 'paste' | 'pasteLink'
type Step = LinkDevicesStep

/** Settings → Linked devices opens the modal straight at a row's step; back / close from there leave the modal. */
export interface LinkDevicesModalArgs {
  step?: LinkDevicesStep
}

/**
 * Only the sheets keep a titled bar (2811:2601 "QR code", 2811:2587 "Scan QR code").
 * Link devices and the paste step are full-screen h1 stages: the frames hide the bar's
 * title (the Device-linking desktop frame 879:20987 draws dots, arrow, then the h1) —
 * only the glyph, the h1 is the title.
 */
const TITLED_STEPS: Partial<Record<Step, string>> = {
  display: 'QR code',
  scan: 'Scan QR code',
}

const PASTE_STEPS: Step[] = ['paste', 'pasteLink']

/** The Scan QR code sheet's copy (2811:2587). */
export const SCAN_QR_CODE_INTRO =
  'Go to “Link devices” on the other device and display the QR code. Scan it to link devices.'

/**
 * Link devices, reached from Get started. "Display QR code" shows the QR code
 * sheet (2811:2601) — a link can only be minted from inside a community, so the
 * row is disabled until there is one; the sheet's close returns here. "Scan QR
 * code" opens the camera, and offers the paste field when it cannot; "Paste
 * link" opens the same paste field directly. Pasted here, only a device link is
 * accepted — a member link shows an error under the input.
 */
export const LinkDevices: React.FC = () => {
  const dispatch = useDispatch()
  const isConnected = useSelector(socketSelectors.isConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const linkedDevices = useSelector(connection.selectors.linkedDevices)

  const linkDevicesModal = useModal<LinkDevicesModalArgs>(ModalName.linkDevicesModal)
  const initialStep: Step = linkDevicesModal.step ?? 'entry'
  const getStartedModal = useModal(ModalName.getStartedModal)
  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const [step, setStep] = useState<Step>('entry')
  const [revealInputValue, setRevealInputValue] = useState(false)

  useEffect(() => {
    setStep(linkDevicesModal.open ? initialStep : 'entry')
    if (linkDevicesModal.open && isConnected) dispatch(connection.actions.getLinkedDevices())
  }, [linkDevicesModal.open, isConnected])

  const leave = () => {
    if (!currentCommunity) getStartedModal.handleOpen()
    linkDevicesModal.handleClose()
  }

  const handleBack = () => {
    if (step === initialStep) {
      leave()
      return
    }
    if (step === 'paste') {
      setStep('scan')
      return
    }
    setStep('entry')
  }

  const handleCommunityAction = (data: InvitationData) => {
    if (isDeviceInvitationData(data)) {
      const payload: LinkDevicePayload = { inviteData: data }
      logger.info('Linking this device from a device link')
      loadingPanelModal.handleOpen()
      dispatch(communities.actions.linkDevice(payload))
      linkDevicesModal.handleClose()
      return
    }
    // A member invitation scanned here still joins, the way Join community does
    // (the paste field passes device links only).
    const payload: JoinCommunityPayload = { inviteData: data }
    dispatch(communities.actions.joinCommunity(payload))
    createUsernameModal.handleOpen()
    linkDevicesModal.handleClose()
  }

  // The QR code sheet (2811:2601) has a close glyph, not a back arrow; closing it reveals Link devices —
  // or, opened straight at the sheet from Settings, leaves the modal.
  const isSheet = step === 'display'

  return (
    <Modal
      open={linkDevicesModal.open}
      handleClose={isSheet && step !== initialStep ? () => setStep('entry') : leave}
      title={TITLED_STEPS[step] ?? ''}
      withoutTitle={!TITLED_STEPS[step]}
      canGoBack={!isSheet}
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
          onPasteLink={() => setStep('pasteLink')}
          canDisplayQrCode={Boolean(currentCommunity)}
          linkedDevices={linkedDevices}
        />
      ) : null}
      {step === 'display' ? <DisplayQrCode dataTestId='link-devices-display' /> : null}
      {step === 'scan' ? (
        <QrScannerComponent
          intro={SCAN_QR_CODE_INTRO}
          onDecoded={handleCommunityAction}
          onUsePasteLink={() => setStep('paste')}
          dataTestId='link-devices-scanner'
        />
      ) : null}
      {PASTE_STEPS.includes(step) ? (
        <PasteLinkComponent
          heading={'Paste a link to Join'}
          open={linkDevicesModal.open}
          isConnectionReady={isConnected}
          revealInputValue={revealInputValue}
          handleClickInputReveal={() => setRevealInputValue(value => !value)}
          linkKind='device'
          handleCommunityAction={handleCommunityAction}
        />
      ) : null}
    </Modal>
  )
}

export default LinkDevices
