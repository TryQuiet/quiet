import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities } from '@zbayapp/nectar'
import { identity } from '@zbayapp/nectar'
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
  const loadingCommunityModal = useModal(ModalName.loadingPanel)

  const unregisteredCommunities = useSelector(identity.selectors.unregisteredCommunities)
  const unregisteredCommunitiesWithoutUserIdentity = useSelector(identity.selectors.unregisteredCommunitiesWithoutUserIdentity)
  const isOwner = useSelector(communities.selectors.isOwner)

  useEffect(() => {
    if (!loadingStartApp.open && !isConnected) {
      loadingStartApp.handleOpen({
        message: LoadingMessages.StartApp
      })
    }
  }, [community, loadingStartApp, dispatch])

  useEffect(() => {
    if (isConnected && unregisteredCommunitiesWithoutUserIdentity.length) {
      let communityAction: CommunityAction
      if (isOwner) {
        communityAction = CommunityAction.Create
      } else {
        communityAction = CommunityAction.Join
      }

      createUsernameModal.handleOpen({
        communityAction: communityAction,
        communityData: unregisteredCommunitiesWithoutUserIdentity[0].name
      })
    }
  }, [unregisteredCommunitiesWithoutUserIdentity, isConnected])

  useEffect(() => {
    if (isConnected) {
      loadingStartApp.handleClose()

      if (unregisteredCommunities.length) {
        loadingCommunityModal.handleOpen({
          message: LoadingMessages.RetryRegistration
        })
      }
    }
  }, [isConnected, unregisteredCommunities])

  useEffect(() => {
    if (!community && !joinCommunityModal.open) {
      joinCommunityModal.handleOpen()
    }
  }, [community, joinCommunityModal, dispatch])

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
      communityAction={CommunityAction.Join}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={handleRedirection}
      isConnectionReady={isConnected}
      community={Boolean(community)}
    />
  )
}

export default JoinCommunity
