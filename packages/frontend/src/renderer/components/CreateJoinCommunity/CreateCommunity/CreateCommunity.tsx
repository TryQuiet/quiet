import React from 'react'
import { useSelector } from 'react-redux'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { CommunityAction } from '../../../components/CreateJoinCommunity/community.keys'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { communities } from '@quiet/nectar'
import PerformCommunityActionComponent from '../PerformCommunityActionComponent'

const CreateCommunity = () => {
  const isConnected = useSelector(socketSelectors.isConnected)

  const community = useSelector(communities.selectors.currentCommunity)
  const createCommunityModal = useModal(ModalName.createCommunityModal)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createUsernameModal = useModal(ModalName.createUsernameModal)

  const handleCommunityAction = (name: string) => {
    createUsernameModal.handleOpen({
      communityAction: CommunityAction.Create,
      communityData: name
    })
  }

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
      communityAction={CommunityAction.Create}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={handleRedirection}
      isConnectionReady={isConnected}
      community={Boolean(community)}
    />
  )
}

export default CreateCommunity
