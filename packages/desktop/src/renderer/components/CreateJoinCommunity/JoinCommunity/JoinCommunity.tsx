import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { CommunityOwnership, CreateNetworkPayload, InvitationPair, TOR_BOOTSTRAP_COMPLETE } from '@quiet/types'
import { communities, identity, connection } from '@quiet/state-manager'
import PerformCommunityActionComponent from '../../../components/CreateJoinCommunity/PerformCommunityActionComponent'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../../containers/hooks'

const JoinCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const invitationCode = useSelector(communities.selectors.invitationCode)

  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)

  const torBootstrapProcessSelector = useSelector(connection.selectors.torBootstrapProcess)

  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)

  useEffect(() => {
    if (
      isConnected &&
      !currentCommunity &&
      !joinCommunityModal.open &&
      torBootstrapProcessSelector === TOR_BOOTSTRAP_COMPLETE
    ) {
      joinCommunityModal.handleOpen()
    }
  }, [isConnected, currentCommunity, torBootstrapProcessSelector])

  useEffect(() => {
    if (currentCommunity && joinCommunityModal.open) {
      joinCommunityModal.handleClose()
    }
  }, [currentCommunity])

  const handleCommunityAction = (address: InvitationPair[]) => {
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      peers: address,
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
      communityOwnership={CommunityOwnership.User}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={handleRedirection}
      isConnectionReady={isConnected}
      isCloseDisabled={!currentCommunity}
      hasReceivedResponse={Boolean(currentIdentity && !currentIdentity.userCertificate)}
      revealInputValue={revealInputValue}
      handleClickInputReveal={handleClickInputReveal}
      invitationCode={invitationCode}
    />
  )
}

export default JoinCommunity
