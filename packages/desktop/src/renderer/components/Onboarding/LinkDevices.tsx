import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, connection } from '@quiet/state-manager'
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
import { ConfirmationToast } from '../ui/ConfirmationToast/ConfirmationToast'
import { DisplayQrCode } from './DisplayQrCode'
import { LinkDevicesComponent } from './LinkDevicesComponent'
import { useCopyDeviceLink } from './useCopyDeviceLink'
import { PasteLinkComponent } from './PasteLinkComponent'
import { QrScannerComponent } from './qrScanner/QrScannerComponent'
import { createLogger } from '../../logger'
import { PASTE_LINK_HEADING, SCAN_QR_CODE_HEADING, SCAN_QR_CODE_INTRO } from '@quiet/common'

const logger = createLogger('LinkDevices')

/** `paste` is the scanner's fallback (back returns to the camera); `pasteLink` is the Paste link row's (back returns here). */
export type LinkDevicesStep = 'entry' | 'display' | 'scan' | 'paste' | 'pasteLink'
type Step = LinkDevicesStep

/** Settings → Linked devices opens the modal straight at a row's step; back / close from there leave the modal. */
export interface LinkDevicesModalArgs {
  step?: LinkDevicesStep
  /** Where the back arrow goes when Account recovery handed over to this modal (#3514). */
  returnTo?: 'recoverAccount'
}

/**
 * Only the camera sheet keeps a titled bar (2811:2587 "Scan QR code"). Link devices and the
 * paste step are full-screen h1 stages: the frames hide the bar's title (the Device-linking
 * desktop frame 879:20987 draws dots, arrow, then the h1) — only the glyph, the h1 is the
 * title. The QR code sheet (2811:2601) is drawn titled, but the code needs no caption (user
 * decision, #3690): its bar zone keeps only the close glyph.
 */
const TITLED_STEPS: Partial<Record<Step, string>> = {
  scan: SCAN_QR_CODE_HEADING,
}

const PASTE_STEPS: Step[] = ['paste', 'pasteLink']

/**
 * Link devices, reached from Get started (receive: "Scan QR code" opens the camera
 * and offers the paste field when it cannot, "Paste link" opens that field directly;
 * pasted here only a device link is accepted) and, inside a community, from Settings
 * (share: "Display QR code" shows the QR code sheet 2811:2601, whose close returns
 * here; "Copy link" copies the same link and confirms).
 *
 * Whichever way a device link arrives — scanned or pasted — linking hands the other
 * device this account, so it goes through the consent sheet rather than starting on
 * arrival. The frame's "Linked devices" list is drawn on the share direction only
 * (TryQuiet/quiet#3636): it is read off the team graph, and the receive direction has no
 * community to read one from.
 */
export const LinkDevices: React.FC = () => {
  const dispatch = useDispatch()
  const isConnected = useSelector(socketSelectors.isConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const linkedDevices = useSelector(connection.selectors.linkedDevices)

  const linkDevicesModal = useModal<LinkDevicesModalArgs>(ModalName.linkDevicesModal)
  const initialStep: Step = linkDevicesModal.step ?? 'entry'
  const getStartedModal = useModal(ModalName.getStartedModal)
  const joinCommunityModal = useModal<{ step?: 'recoverAccount' }>(ModalName.joinCommunityModal)
  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const [step, setStep] = useState<Step>('entry')
  const [revealInputValue, setRevealInputValue] = useState(false)
  const [pendingDeviceInvite, setPendingDeviceInvite] = useState<DeviceInvitationData | null>(null)
  // Inside a community this device shares (Display QR code, Copy link); without one it receives.
  const direction = currentCommunity ? 'share' : 'receive'
  const copyLink = useCopyDeviceLink(linkDevicesModal.open && step === 'entry' && direction === 'share')

  useEffect(() => {
    setStep(linkDevicesModal.open ? initialStep : 'entry')
  }, [linkDevicesModal.open])

  // The list is read when the surface opens sharing; the master saga refreshes it
  // afterwards whenever the user set changes.
  useEffect(() => {
    if (linkDevicesModal.open && direction === 'share') dispatch(connection.actions.getLinkedDevices())
  }, [dispatch, direction, linkDevicesModal.open])

  const leave = () => {
    if (linkDevicesModal.returnTo === 'recoverAccount') {
      // Opened from Account recovery → "Use linked device" (#3514): back returns there,
      // not to Get started.
      joinCommunityModal.handleOpen({ step: 'recoverAccount' })
      linkDevicesModal.handleClose()
      return
    }
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
      // Linking a device hands the other device this account, so it is never done without
      // consent. A scanned code is no more deliberate than a pasted one: the camera decodes
      // whatever is in front of it, so the scan path needs the gate at least as much.
      setPendingDeviceInvite(data)
      return
    }
    // A member invitation scanned here still joins, the way Join community does
    // (the paste field passes device links only).
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

  // The QR code sheet (2811:2601) has a close glyph, not a back arrow; closing it reveals Link devices —
  // or, opened straight at the sheet from Settings, leaves the modal.
  const isSheet = step === 'display'

  return (
    <>
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
          <>
            <LinkDevicesComponent
              direction={direction}
              onDisplayQrCode={() => setStep('display')}
              deviceLink={copyLink.deviceLink}
              onCopyLink={copyLink.onCopyLink}
              onLinkCopied={copyLink.onLinkCopied}
              onScanQrCode={() => setStep('scan')}
              onPasteLink={() => setStep('pasteLink')}
              linkedDevices={direction === 'share' ? linkedDevices : undefined}
            />
            <ConfirmationToast open={copyLink.copied} message={'Copied'} onClose={copyLink.dismissCopied} />
          </>
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
            heading={PASTE_LINK_HEADING}
            open={linkDevicesModal.open}
            isConnectionReady={isConnected}
            revealInputValue={revealInputValue}
            handleClickInputReveal={() => setRevealInputValue(value => !value)}
            linkKind='device'
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
