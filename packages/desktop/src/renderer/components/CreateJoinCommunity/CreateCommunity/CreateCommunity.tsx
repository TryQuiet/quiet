import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { communities, identity } from '@quiet/state-manager'
import { CommunityOwnership, AddCommunityPayload } from '@quiet/types'
import PerformCommunityActionComponent from '../PerformCommunityActionComponent'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../../containers/hooks'

const CreateCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const createCommunityModal = useModal(ModalName.createCommunityModal)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)

  useEffect(() => {
    if (currentCommunity && createCommunityModal.open) {
      createCommunityModal.handleClose()
    }
  }, [currentCommunity])

  const handleCommunityAction = (name: string) => {
    const payload: AddCommunityPayload = {
      ownership: CommunityOwnership.Owner,
      name: name,
    }
    dispatch(communities.actions.addCommunity(payload))
  }

  // From 'You can join a community instead' link
  const handleRedirection = () => {
    if (!joinCommunityModal.open) {
      joinCommunityModal.handleOpen()
    } else {
      createCommunityModal.handleClose()
    }
  }

  return (
    <PerformCommunityActionComponent
      {...createCommunityModal}
      communityOwnership={CommunityOwnership.Owner}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={handleRedirection}
      isConnectionReady={isConnected}
      isCloseDisabled={!currentCommunity}
      hasReceivedResponse={Boolean(currentIdentity && !currentIdentity.userCertificate)}
      revealInputValue={true}
    />
  )
}

export default CreateCommunity
