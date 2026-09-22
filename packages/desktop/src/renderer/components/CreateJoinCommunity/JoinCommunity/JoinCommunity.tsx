import { communities } from '@quiet/state-manager'
import {
  ErrorMessages,
  type DeviceInvitationData,
  type InvitationData,
  type JoinCommunityPayload,
  type LinkDevicePayload,
  isDeviceInvitationData,
} from '@quiet/types'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Modal from '../../ui/Modal/Modal'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { DeviceLinkConsentComponent } from '../../DeviceLinkConsent/DeviceLinkConsent'
import { JoinCommunityOptionsComponent } from '../../Onboarding/JoinCommunityOptionsComponent'
import { RecoverAccountComponent } from '../../Onboarding/RecoverAccountComponent'
import { OpenInviteLinkComponent } from '../../Onboarding/OpenInviteLinkComponent'
import { PasteLinkComponent } from '../../Onboarding/PasteLinkComponent'
import { QrScannerComponent } from '../../Onboarding/qrScanner/QrScannerComponent'
import { createLogger } from '../../../logger'

const logger = createLogger('JoinCommunity')

type Step = 'options' | 'recoverAccount' | 'openInviteLink' | 'pasteInviteLink' | 'scanQrCode' | 'pasteFromQrCode'

/**
 * The bar per step. Every step of this modal carries its own large heading, and
 * a page with a heading gets no bar title: only the back glyph shows and the
 * heading is the title. The full-screen frames already hide their title text
 * (Join community 2811:2562 "Quiet", Account recovery 2811:2535, Open invite
 * link 2811:2455, Paste a link 3190:10892 "Join with invite link"); the Join
 * with QR code sheet (2811:2460) is drawn titled in the prototype, but on
 * desktop it is a full-window step under its own heading, so its bar title
 * goes too, and so does the paste field the scanner falls back to. Left as a
 * map: a step without a heading would take one.
 */
const TITLED_STEPS: Partial<Record<Step, string>> = {}

/**
 * Join community: the three-way choice, then Open invite link → Paste a link,
 * or Join with QR code → the camera. A scanned code and a pasted link take the
 * same path; when the camera cannot be used the scanner offers the paste field.
 * Recover account is the designed info screen: "Use linked device" hands over
 * to the Link devices modal, "Use invite link" continues to Open invite link.
 *
 * An invite link opened while this modal is showing takes the deep-link path
 * (customProtocolSaga): it dispatches joinCommunity and opens Choose username
 * on top, and this modal keeps its step underneath, so closing that returns
 * to the screen the link arrived on.
 */
const JoinCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const joinCommunityError = useSelector(communities.selectors.joinCommunityError)
  const admissionResetStatus = useSelector(communities.selectors.admissionResetStatus)

  const createUsernameModal = useModal(ModalName.createUsernameModal)
  // `step`: the step to reopen on (Link devices' back arrow returns to Account recovery).
  const joinCommunityModal = useModal<{ step?: 'recoverAccount' }>(ModalName.joinCommunityModal)
  const getStartedModal = useModal(ModalName.getStartedModal)
  const linkDevicesModal = useModal<{ returnTo?: 'recoverAccount' }>(ModalName.linkDevicesModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  // The screens visited inside this modal; the back arrow pops one.
  const [trail, setTrail] = useState<Step[]>(['options'])
  const step = trail[trail.length - 1]
  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)
  const [pendingDeviceInvite, setPendingDeviceInvite] = useState<DeviceInvitationData | null>(null)

  // Admission failures are reported on the invite field, the way the join form has always reported
  // a bad link.
  const joinCommunityErrorMessage =
    joinCommunityError?.type === 'invalid'
      ? ErrorMessages.INVALID_INVITE
      : joinCommunityError?.type === 'interrupted'
        ? ErrorMessages.ADMISSION_INTERRUPTED_RETRY
        : joinCommunityError?.type === 'timeout'
          ? joinCommunityError.invitationType === 'device'
            ? ErrorMessages.DEVICE_ADMISSION_TIMEOUT
            : ErrorMessages.COMMUNITY_ADMISSION_TIMEOUT
          : undefined

  const clearJoinCommunityError = () => {
    if (joinCommunityError) {
      dispatch(communities.actions.clearJoinCommunityError())
    }
  }

  useEffect(() => {
    if (!joinCommunityModal.open) {
      setTrail(['options'])
      return
    }
    // Reopened by Link devices' back arrow: land on the step it was opened from.
    if (joinCommunityModal.step === 'recoverAccount') setTrail(['options', 'recoverAccount'])
  }, [joinCommunityModal.open])

  // A failed join reports itself on the invite field, so the flow reopens on the paste step rather
  // than at the three-way choice, where there is no field to carry the message.
  useEffect(() => {
    if (!isConnected || !joinCommunityError || currentCommunity || admissionResetStatus !== 'idle') return
    // The paste step is reached through Open invite link, so the reopened trail is the path the
    // user would have walked; the back arrow then behaves as it does when they get there by hand.
    setTrail(visited =>
      visited[visited.length - 1] === 'options' ? ['options', 'openInviteLink', 'pasteInviteLink'] : visited
    )
    if (!joinCommunityModal.open) {
      logger.info('Reopening join community modal to report a join error')
      joinCommunityModal.handleOpen()
    }
  }, [isConnected, joinCommunityError, currentCommunity, admissionResetStatus, joinCommunityModal.open])

  useEffect(() => {
    if (isConnected && currentCommunity && joinCommunityModal.open) {
      logger.info('Closing join community modal since community is joined')
      joinCommunityModal.handleClose()
    }
  }, [isConnected, currentCommunity, joinCommunityModal.open])

  const go = (next: Step) => setTrail(visited => [...visited, next])

  const handleCommunityAction = (data: InvitationData) => {
    if (isDeviceInvitationData(data)) {
      // Linking a device hands the other device this account, so it is never done without consent.
      setPendingDeviceInvite(data)
      return
    }

    const joinCommunityPayload: JoinCommunityPayload = {
      inviteData: data,
    }
    clearJoinCommunityError()
    dispatch(communities.actions.joinCommunity(joinCommunityPayload))
    createUsernameModal.handleOpen()
    joinCommunityModal.handleClose()
  }

  // Account recovery → Link devices: the prototype's own link. The Link devices
  // modal takes over; its back arrow returns here, to Account recovery.
  const handleUseLinkedDevice = () => {
    linkDevicesModal.handleOpen({ returnTo: 'recoverAccount' })
    joinCommunityModal.handleClose()
  }

  const confirmDeviceLink = () => {
    if (!pendingDeviceInvite) return
    const linkDevicePayload: LinkDevicePayload = {
      inviteData: pendingDeviceInvite,
      deviceLinkConsent: true,
      confirmedQssEndpoint: pendingDeviceInvite.version === 'v5' ? pendingDeviceInvite.qssEndpoint : undefined,
    }
    loadingPanelModal.handleOpen()
    clearJoinCommunityError()
    dispatch(communities.actions.linkDevice(linkDevicePayload))
    joinCommunityModal.handleClose()
    setPendingDeviceInvite(null)
  }

  // Leaving the flow dismisses a reported join error; otherwise the flow would reopen itself on
  // the way out.
  const leave = () => {
    clearJoinCommunityError()
    joinCommunityModal.handleClose()
  }

  const handleBack = () => {
    if (trail.length > 1) {
      setTrail(visited => visited.slice(0, -1))
      return
    }
    if (!currentCommunity) getStartedModal.handleOpen()
    leave()
  }

  const handleClickInputReveal = () => {
    setRevealInputValue(value => !value)
  }

  return (
    <>
      <Modal
        open={joinCommunityModal.open}
        handleClose={leave}
        title={TITLED_STEPS[step]}
        withoutTitle={TITLED_STEPS[step] === undefined}
        canGoBack
        handleBack={handleBack}
        alignCloseLeft
        contentWidth={'100%'}
        testIdPrefix={'joinCommunity'}
        zIndex={1300}
      >
        {step === 'options' ? (
          <JoinCommunityOptionsComponent
            onJoinWithInviteLink={() => go('openInviteLink')}
            onJoinWithQrCode={() => go('scanQrCode')}
            onRecoverAccount={() => go('recoverAccount')}
          />
        ) : null}
        {step === 'recoverAccount' ? (
          <RecoverAccountComponent
            onUseLinkedDevice={handleUseLinkedDevice}
            onUseInviteLink={() => go('openInviteLink')}
          />
        ) : null}
        {step === 'openInviteLink' ? <OpenInviteLinkComponent onPasteLink={() => go('pasteInviteLink')} /> : null}
        {step === 'scanQrCode' ? (
          <QrScannerComponent onDecoded={handleCommunityAction} onUsePasteLink={() => go('pasteFromQrCode')} />
        ) : null}
        {step === 'pasteInviteLink' || step === 'pasteFromQrCode' ? (
          <PasteLinkComponent
            heading={'Paste a link to join'}
            open={joinCommunityModal.open}
            isConnectionReady={isConnected}
            revealInputValue={revealInputValue}
            handleClickInputReveal={handleClickInputReveal}
            handleCommunityAction={handleCommunityAction}
            fieldError={joinCommunityErrorMessage}
            onFieldChange={clearJoinCommunityError}
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

export default JoinCommunity
