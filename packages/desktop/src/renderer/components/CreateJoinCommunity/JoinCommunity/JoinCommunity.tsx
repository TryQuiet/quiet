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
import { createLogger } from '../../../logger'

const logger = createLogger('JoinCommunity')

type Step = 'options' | 'openInviteLink' | 'pasteInviteLink' | 'pasteQrCode'

const TITLES: Record<Step, string> = {
  options: 'Quiet',
  openInviteLink: 'Join with invite link',
  pasteInviteLink: 'Join with invite link',
  pasteQrCode: 'Join with QR code',
}

/**
 * Join community: the three-way choice, then Open invite link → Paste a link.
 * Desktop has no camera, so "Join with QR code" also lands on the paste step.
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
      case 'openInviteLink':
      case 'pasteQrCode':
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
      testIdPrefix={'joinCommunity'}
      zIndex={1300}
    >
      {step === 'options' ? (
        <JoinCommunityOptionsComponent
          onJoinWithInviteLink={() => setStep('openInviteLink')}
          onJoinWithQrCode={() => setStep('pasteQrCode')}
        />
      ) : null}
      {step === 'openInviteLink' ? <OpenInviteLinkComponent onPasteLink={() => setStep('pasteInviteLink')} /> : null}
      {step === 'pasteInviteLink' || step === 'pasteQrCode' ? (
        <PasteLinkComponent
          heading={step === 'pasteQrCode' ? 'Join with QR code' : 'Paste a link to Join'}
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
