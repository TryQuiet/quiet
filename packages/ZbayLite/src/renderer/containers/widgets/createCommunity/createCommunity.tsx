import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, identity } from '@zbayapp/nectar'
import { CommunityAction } from '../../../components/widgets/performCommunityAction/community.keys'
import PerformCommunityActionComponent from '../../../components/widgets/performCommunityAction/PerformCommunityActionComponent'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'

const CreateCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)

  const id = useSelector(identity.selectors.currentIdentity)

  const createCommunityModal = useModal(ModalName.createCommunityModal)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createUsernameModal = useModal(ModalName.createUsernameModal)

  useEffect(() => {
    if (id?.hiddenService) {
      createUsernameModal.handleOpen()
      createCommunityModal.handleClose()
    }
  }, [id])

  const handleCommunityAction = (value: string) => {
    dispatch(communities.actions.createNewCommunity(value))
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
      initialValue={''}
      communityAction={CommunityAction.Create}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={handleRedirection}
      isConnectionReady={isConnected}
    />
  )
}

export default CreateCommunity
