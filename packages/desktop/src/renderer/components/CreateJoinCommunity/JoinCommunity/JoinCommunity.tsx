import { communities } from '@quiet/state-manager'
import {
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
import { JoinCommunityOptionsComponent } from '../../Onboarding/JoinCommunityOptionsComponent'
import { OpenInviteLinkComponent } from '../../Onboarding/OpenInviteLinkComponent'
import { PasteLinkComponent } from '../../Onboarding/PasteLinkComponent'
import { QrScannerComponent } from '../../Onboarding/qrScanner/QrScannerComponent'
import { createLogger } from '../../../logger'

const logger = createLogger('JoinCommunity')

type Step = 'options' | 'openInviteLink' | 'pasteInviteLink' | 'scanQrCode' | 'pasteFromQrCode'

/** Title bar text per step, from the prototype's frames (2811:2562, 2811:2455, 3190:10892, 2811:2460). */
const TITLES: Record<Step, string> = {
  options: 'Quiet',
  openInviteLink: 'Join with invite link',
  pasteInviteLink: 'Join with invite link',
  scanQrCode: 'Join with QR code',
  pasteFromQrCode: 'Join with invite link',
}

/**
 * Join community: the three-way choice, then Open invite link → Paste a link, or
 * Join with QR code → the camera. A scanned code and a pasted link take the same path;
 * when the camera cannot be used the scanner offers the paste field.
 */
const JoinCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)

  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const getStartedModal = useModal(ModalName.getStartedModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const [step, setStep] = useState<Step>('options')
  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)

  useEffect(() => {
    if (!joinCommunityModal.open) setStep('options')
  }, [joinCommunityModal.open])

  useEffect(() => {
    if (isConnected && currentCommunity && joinCommunityModal.open) {
      logger.info('Closing join community modal since community is joined')
      joinCommunityModal.handleClose()
    }
  }, [isConnected, currentCommunity, joinCommunityModal.open])

  const handleCommunityAction = (data: InvitationData) => {
    if (isDeviceInvitationData(data)) {
      const linkDevicePayload: LinkDevicePayload = {
        inviteData: data,
      }
      loadingPanelModal.handleOpen()
      dispatch(communities.actions.linkDevice(linkDevicePayload))
      joinCommunityModal.handleClose()
      return
    }

    const joinCommunityPayload: JoinCommunityPayload = {
      inviteData: data,
    }
    dispatch(communities.actions.joinCommunity(joinCommunityPayload))
    createUsernameModal.handleOpen()
    joinCommunityModal.handleClose()
  }

  const handleBack = () => {
    switch (step) {
      case 'pasteInviteLink':
        setStep('openInviteLink')
        return
      case 'pasteFromQrCode':
        setStep('scanQrCode')
        return
      case 'openInviteLink':
      case 'scanQrCode':
        setStep('options')
        return
      default:
        if (!currentCommunity) getStartedModal.handleOpen()
        joinCommunityModal.handleClose()
    }
  }

  const handleClickInputReveal = () => {
    setRevealInputValue(value => !value)
  }

  return (
    <Modal
      open={joinCommunityModal.open}
      handleClose={joinCommunityModal.handleClose}
      title={TITLES[step]}
      canGoBack
      handleBack={handleBack}
      alignCloseLeft
      contentWidth={'100%'}
      testIdPrefix={'joinCommunity'}
      zIndex={1300}
    >
      {step === 'options' ? (
        <JoinCommunityOptionsComponent
          onJoinWithInviteLink={() => setStep('openInviteLink')}
          onJoinWithQrCode={() => setStep('scanQrCode')}
        />
      ) : null}
      {step === 'openInviteLink' ? <OpenInviteLinkComponent onPasteLink={() => setStep('pasteInviteLink')} /> : null}
      {step === 'scanQrCode' ? (
        <QrScannerComponent onDecoded={handleCommunityAction} onUsePasteLink={() => setStep('pasteFromQrCode')} />
      ) : null}
      {step === 'pasteInviteLink' || step === 'pasteFromQrCode' ? (
        <PasteLinkComponent
          heading={'Paste a link to Join'}
          open={joinCommunityModal.open}
          isConnectionReady={isConnected}
          revealInputValue={revealInputValue}
          handleClickInputReveal={handleClickInputReveal}
          handleCommunityAction={handleCommunityAction}
        />
      ) : null}
    </Modal>
  )
}

export default JoinCommunity
