import { communities, connection } from '@quiet/state-manager'
import {
  CommunityOwnership,
  type InvitationData,
  type JoinCommunityPayload,
  type LinkDevicePayload,
  isDeviceInvitationData,
} from '@quiet/types'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PerformCommunityActionComponent from '../../../components/CreateJoinCommunity/PerformCommunityActionComponent'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { createLogger } from '../../../logger'

const logger = createLogger('JoinCommunity')

const JoinCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)

  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const torBootstrapProcessSelector = useSelector(connection.selectors.torBootstrapProcess)

  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)

  useEffect(() => {
    if (isConnected && !currentCommunity && !invitationCodes && !joinCommunityModal.open) {
      logger.info('Opening join community modal')
      joinCommunityModal.handleOpen()
    }
  }, [isConnected, currentCommunity, invitationCodes, torBootstrapProcessSelector])

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

  // From 'You can create a new community instead' link
  const handleRedirection = () => {
    if (!createCommunityModal.open) {
      createCommunityModal.handleOpen()
      joinCommunityModal.handleClose()
    } else {
      joinCommunityModal.handleClose()
    }
  }

  const handleClickInputReveal = () => {
    revealInputValue ? setRevealInputValue(false) : setRevealInputValue(true)
  }

  return (
    <PerformCommunityActionComponent
      {...joinCommunityModal}
      communityOwnership={CommunityOwnership.User}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={handleRedirection}
      isConnectionReady={isConnected}
      isCloseDisabled={!currentCommunity}
      hasReceivedResponse={invitationCodes === null}
      revealInputValue={revealInputValue}
      handleClickInputReveal={handleClickInputReveal}
    />
  )
}

export default JoinCommunity
