import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, identity } from '@zbayapp/nectar'
import { CommunityAction } from '../../../components/widgets/performCommunityAction/community.keys'
import PerformCommunityActionComponent from '../../../components/widgets/performCommunityAction/PerformCommunityActionComponent'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'

const JoinCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)

  const community = useSelector(communities.selectors.currentCommunity)
  const id = useSelector(identity.selectors.currentIdentity)

  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)
  const createUsernameModal = useModal(ModalName.createUsernameModal)

  useEffect(() => {
    if (!community && !joinCommunityModal.open) {
      joinCommunityModal.handleOpen()
    }
  }, [community, joinCommunityModal, dispatch])

  useEffect(() => {
    if (id?.hiddenService) {
      createUsernameModal.handleOpen()
      joinCommunityModal.handleClose()
    }
  }, [id])

  const handleCommunityAction = (value: string) => {
    dispatch(communities.actions.joinCommunity(value))
  }

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
      initialValue={''}
      communityAction={CommunityAction.Join}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={handleRedirection}
      isConnectionReady={isConnected}
    />
  )
}

export default JoinCommunity
