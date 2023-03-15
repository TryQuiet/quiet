import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { communities, identity, CommunityOwnership, CreateNetworkPayload } from '@quiet/state-manager'
import PerformCommunityActionComponent from '../../../components/CreateJoinCommunity/PerformCommunityActionComponent'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../../containers/hooks'

const JoinCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const invitationCode = useSelector(communities.selectors.invitationCode)
  console.log('Invitation code in JOIN COMMUNITY', invitationCode)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)

  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)

  useEffect(() => {
    if (isConnected && !currentCommunity && !joinCommunityModal.open) {
      joinCommunityModal.handleOpen()
    }
  }, [isConnected, currentCommunity])

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

  const handleClickInputReveal = () => {
    revealInputValue ? setRevealInputValue(false) : setRevealInputValue(true)
  }

  return (
    <PerformCommunityActionComponent
      {...joinCommunityModal}
      invitationCode={invitationCode}
      communityOwnership={CommunityOwnership.User}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={handleRedirection}
      isConnectionReady={isConnected}
      isCloseDisabled={!currentCommunity}
      hasReceivedResponse={Boolean(currentIdentity && !currentIdentity.userCertificate)}
      revealInputValue={revealInputValue}
      handleClickInputReveal={handleClickInputReveal}
    />
  )
}

export default JoinCommunity
