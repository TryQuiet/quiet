import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { CommunityOwnership, AddCommunityPayload, InvitationData, InvitationPair } from '@quiet/types'
import { communities, identity, connection, network } from '@quiet/state-manager'
import PerformCommunityActionComponent from '../../../components/CreateJoinCommunity/PerformCommunityActionComponent'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../../containers/hooks'

const JoinCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  // Invitation link data should be already available if user joined via deep link
  const invitationCodes = useSelector(communities.selectors.invitationCodes)
  const psk = useSelector(communities.selectors.psk)

  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)

  const torBootstrapProcessSelector = useSelector(connection.selectors.torBootstrapProcess)

  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)

  useEffect(() => {
    if (isConnected && !currentCommunity && !joinCommunityModal.open) {
      joinCommunityModal.handleOpen()
    }
  }, [isConnected, currentCommunity, torBootstrapProcessSelector])

  useEffect(() => {
    if (currentCommunity && joinCommunityModal.open) {
      joinCommunityModal.handleClose()
    }
  }, [currentCommunity])

  const handleCommunityAction = (data: InvitationData) => {
    const payload: AddCommunityPayload = {
      ownership: CommunityOwnership.User,
      peers: data.pairs,
      psk: data.psk,
      ownerOrbitDbIdentity: data.ownerOrbitDbIdentity,
    }
    dispatch(communities.actions.addCommunity(payload))
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
      invitationCode={invitationCodes}
      psk={psk}
    />
  )
}

export default JoinCommunity
