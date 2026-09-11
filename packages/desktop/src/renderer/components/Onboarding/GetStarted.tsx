import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { communities, connection } from '@quiet/state-manager'

import Modal from '../ui/Modal/Modal'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { socketSelectors } from '../../sagas/socket/socket.selectors'
import { GetStartedComponent } from './GetStartedComponent'
import { createLogger } from '../../logger'

const logger = createLogger('GetStarted')

/**
 * The onboarding entry point. Opens itself when the app is connected and has no
 * community, unless another onboarding modal is already showing.
 */
export const GetStarted: React.FC = () => {
  const isConnected = useSelector(socketSelectors.isConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)
  const torBootstrapProcess = useSelector(connection.selectors.torBootstrapProcess)

  const getStartedModal = useModal(ModalName.getStartedModal)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)
  const linkDevicesModal = useModal(ModalName.linkDevicesModal)
  const createUsernameModal = useModal(ModalName.createUsernameModal)

  const anotherOnboardingModalOpen =
    joinCommunityModal.open || createCommunityModal.open || linkDevicesModal.open || createUsernameModal.open

  useEffect(() => {
    if (isConnected && !currentCommunity && !invitationCodes && !getStartedModal.open && !anotherOnboardingModalOpen) {
      logger.info('Opening get started modal')
      getStartedModal.handleOpen()
    }
  }, [isConnected, currentCommunity, invitationCodes, torBootstrapProcess, anotherOnboardingModalOpen])

  useEffect(() => {
    if (isConnected && currentCommunity && getStartedModal.open) {
      logger.info('Closing get started modal since community is joined')
      getStartedModal.handleClose()
    }
  }, [isConnected, currentCommunity, getStartedModal.open])

  const go = (modal: ReturnType<typeof useModal>) => () => {
    modal.handleOpen()
    getStartedModal.handleClose()
  }

  return (
    <Modal
      open={getStartedModal.open}
      handleClose={getStartedModal.handleClose}
      title={'Quiet'}
      isCloseDisabled={!currentCommunity}
      alignCloseLeft
      contentWidth={'100%'}
      testIdPrefix={'getStarted'}
      zIndex={1300}
    >
      <GetStartedComponent
        onJoinCommunity={go(joinCommunityModal)}
        onCreateCommunity={go(createCommunityModal)}
        onLinkDevices={go(linkDevicesModal)}
      />
    </Modal>
  )
}

export default GetStarted
