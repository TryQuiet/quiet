import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, errors, identity, publicChannels, socketActionTypes, connection, ErrorCodes } from '@quiet/nectar'
import CreateUsernameComponent from '../CreateUsername/CreateUsernameComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'
import { CommunityAction } from '../widgets/performCommunityAction/community.keys'
import { LoadingMessages } from '../../containers/widgets/loadingPanel/loadingMessages'
import { socketSelectors } from '../../sagas/socket/socket.selectors'

export interface CreateUsernameProps {
  communityAction: CommunityAction
  communityData: string
}

const CreateUsername = () => {
  const dispatch = useDispatch()

  const [username, setUsername] = useState('')
  const [isCreateUserNameStarted, setIsCreateUserNameStarted] = useState(false)
  const [isRetryingRegistration, setIsRetryingRegistration] = useState(false)

  const id = useSelector(identity.selectors.currentIdentity)
  const certificate = useSelector(identity.selectors.currentIdentity)?.userCertificate
  const communityErrors = useSelector(errors.selectors.currentCommunityErrors)
  const error = communityErrors[socketActionTypes.REGISTRAR]

  const currentCommunityId = useSelector(communities.selectors.currentCommunityId)
  const invitationUrl = useSelector(communities.selectors.registrarUrl(currentCommunityId))
  const channels = useSelector(publicChannels.selectors.publicChannels)
  const initializedCommunitiesCount = Object.keys(useSelector(connection.selectors.initializedCommunities)).length
  const allCommunitiesCount = useSelector(communities.selectors.allCommunities).length
  const allCommunitiesInitialized = allCommunitiesCount > 0 && initializedCommunitiesCount === allCommunitiesCount

  const createUsernameModal = useModal<CreateUsernameProps>(ModalName.createUsernameModal)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)
  const loadingCommunityModal = useModal(ModalName.loadingPanel)

  const isCommunityWithoutUserIdentity = useSelector(identity.selectors.unregisteredCommunitiesWithoutUserIdentity)
  const isUnregisteredCommunity = useSelector(identity.selectors.unregisteredCommunities)

  const isConnected = useSelector(socketSelectors.isConnected)
  const isOwner = useSelector(communities.selectors.isOwner)

  useEffect(() => {
    if (isConnected && isCommunityWithoutUserIdentity && !isCreateUserNameStarted) {
      let communityAction: CommunityAction
      isOwner ? communityAction = CommunityAction.Create : communityAction = CommunityAction.Join
      setIsRetryingRegistration(true)
      createUsernameModal.handleOpen({
        communityAction: communityAction,
        communityData: isCommunityWithoutUserIdentity.registrarUrl
      })
    }
  }, [isCommunityWithoutUserIdentity, isConnected, isCreateUserNameStarted])

  useEffect(() => {
    let communityMessage: LoadingMessages

    if (isUnregisteredCommunity && !loadingCommunityModal.open) {
      isOwner ? communityMessage = LoadingMessages.CreateCommunity : communityMessage = LoadingMessages.JoinCommunity
      loadingCommunityModal.handleOpen({
        message: communityMessage
      })
    }
  }, [isUnregisteredCommunity])
  
  useEffect(() => {
    // when Quiet is reopening in create username modal, we need to set createUsernameModal.communityAction
    if (!createUsernameModal.communityAction) {
      isOwner ? createUsernameModal.communityAction = CommunityAction.Create : createUsernameModal.communityAction = CommunityAction.Join
    }
    if (certificate && allCommunitiesInitialized && !isCommunityWithoutUserIdentity &&
      ((createUsernameModal.communityAction === CommunityAction.Join && channels.length) ||
        (createUsernameModal.communityAction === CommunityAction.Create && invitationUrl))) {
      loadingCommunityModal.handleClose()
      createUsernameModal.handleClose()
      joinCommunityModal.handleClose()
      createCommunityModal.handleClose()
    }
  }, [channels.length, invitationUrl, certificate, allCommunitiesInitialized, isCommunityWithoutUserIdentity, isUnregisteredCommunity])

  useEffect(() => {
    if (id?.hiddenService && !certificate) {
      dispatch(identity.actions.registerUsername(username))
    }
  }, [id?.hiddenService])

  useEffect(() => {
    if (error?.code === ErrorCodes.VALIDATION) {
      loadingCommunityModal.handleClose()
    }
  }, [error])

  const handleAction = (payload: { nickname: string }) => {
    setIsCreateUserNameStarted(true)
    setUsername(payload.nickname)
    const value = createUsernameModal.communityData
    let action
    /* Launch/create community */
    if (isRetryingRegistration) {
      dispatch(communities.actions.removeUnregisteredCommunity(isCommunityWithoutUserIdentity))
      action =
        createUsernameModal.communityAction === CommunityAction.Create
          ? communities.actions.createNewCommunity(isCommunityWithoutUserIdentity.name)
          : communities.actions.joinCommunity(isCommunityWithoutUserIdentity.registrarUrl)
    } else {
      action =
        createUsernameModal.communityAction === CommunityAction.Create
          ? communities.actions.createNewCommunity(value)
          : communities.actions.joinCommunity(value)
    }
    const message = createUsernameModal.communityAction === CommunityAction.Create
      ? LoadingMessages.CreateCommunity
      : LoadingMessages.JoinCommunity

    loadingCommunityModal.handleOpen({
      message
    })
    dispatch(action)
  }

  return (
    <CreateUsernameComponent
      {...createUsernameModal}
      handleRegisterUsername={handleAction}
      certificateRegistrationError={error?.message}
      certificate={certificate}
    />
  )
}

export default CreateUsername
