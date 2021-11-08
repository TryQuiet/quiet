import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities } from '@zbayapp/nectar'
import { CommunityAction } from '../../../components/widgets/performCommunityAction/community.keys'
import PerformCommunityActionComponent from '../../../components/widgets/performCommunityAction/PerformCommunityActionComponent'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { CreateUsernameModalProps } from '../createUsernameModal/CreateUsername'
import { LoadingMessages } from '../loadingPanel/loadingMessages'

const JoinCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)
  const community = useSelector(communities.selectors.currentCommunity)

  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)
  const createUsernameModal = useModal<CreateUsernameModalProps>(ModalName.createUsernameModal)

  const loadingStartApp = useModal(ModalName.loadingPanel)

  useEffect(() => {
    if (!community && !loadingStartApp.open && !isConnected) {
      loadingStartApp.handleOpen({
        message: LoadingMessages.StartApp
      })
    }
  }, [community, loadingStartApp, dispatch])

  useEffect(() => {
    if (isConnected) {
      loadingStartApp.handleClose()
      joinCommunityModal.handleOpen()
    }
  }, [isConnected])

  const handleCommunityAction = (address: string) => {
    createUsernameModal.handleOpen({
      communityAction: CommunityAction.Join,
      communityData: address
    })
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
