import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { communities, identity, CommunityOwnership, CreateNetworkPayload } from '@quiet/nectar'
import PerformCommunityActionComponent from '../../../components/CreateJoinCommunity/PerformCommunityActionComponent'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../../containers/hooks'

const JoinCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)

  useEffect(() => {
    if (!currentCommunity && !joinCommunityModal.open) {
      joinCommunityModal.handleOpen()
    }
  }, [currentCommunity])

  useEffect(() => {
    if (currentIdentity && !currentIdentity.userCertificate && joinCommunityModal.open) {
      joinCommunityModal.handleClose()
    }
  }, [currentIdentity])

  const handleCommunityAction = (address: string) => {
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      registrar: address
    }
    dispatch(communities.actions.createNetwork(payload))
  }

  // From 'You can create a new community instead' link
  const handleRedirection = () => {
    if (!createCommunityModal.open) {
      createCommunityModal.handleOpen()
    } else {
      joinCommunityModal.handleClose()
    }
  }

  return (
    <PerformCommunityActionComponent
      {...joinCommunityModal}
      communityOwnership={CommunityOwnership.User}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={handleRedirection}
      isConnectionReady={isConnected}
      isCloseDisabled={!currentCommunity}
      hasReceivedResponse={Boolean(currentIdentity && !currentIdentity.userCertificate)}
    />
  )
}

export default JoinCommunity
