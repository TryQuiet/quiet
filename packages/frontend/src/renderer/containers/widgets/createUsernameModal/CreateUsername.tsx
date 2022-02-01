import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, errors, identity, publicChannels, socketActionTypes, connection, ErrorCodes } from '@quiet/nectar'
import CreateUsernameModalComponent from '../../../components/widgets/createUsername/CreateUsernameModal'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'
import { CommunityAction } from '../../../components/widgets/performCommunityAction/community.keys'
import { LoadingMessages } from '../loadingPanel/loadingMessages'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'

export interface CreateUsernameModalProps {
  communityAction: CommunityAction
  communityData: string
}

const CreateUsernameModal = () => {
  const dispatch = useDispatch()

  const [username, setUsername] = useState('')
  const [isCreateUserNameStarted, setIsCreateUserNameStarted] = useState(false)
  const [isRetryingRegistration, setIsRetryingRegistration] = useState(false)

  const id = useSelector(identity.selectors.currentIdentity)
  const certificate = useSelector(identity.selectors.currentIdentity)?.userCertificate
  const communityErrors = useSelector(errors.selectors.currentCommunityErrorsByType)
  const error = communityErrors?.[socketActionTypes.REGISTRAR]

  const currentCommunityId = useSelector(communities.selectors.currentCommunityId)
  const invitationUrl = useSelector(communities.selectors.registrarUrl(currentCommunityId))
  const channels = useSelector(publicChannels.selectors.publicChannels)
  const initializedCommunitiesCount = Object.keys(useSelector(connection.selectors.initializedCommunities)).length
  const allCommunitiesCount = useSelector(communities.selectors.allCommunities).length
  const allCommunitiesInitialized = allCommunitiesCount > 0 && initializedCommunitiesCount === allCommunitiesCount

  const createUsernameModal = useModal<CreateUsernameModalProps>(ModalName.createUsernameModal)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)
  const loadingCommunityModal = useModal(ModalName.loadingPanel)

  const communitiesWithoutUserIdentity = useSelector(identity.selectors.unregisteredCommunitiesWithoutUserIdentity)
  const isCommunityWithoutUserIdentity = communitiesWithoutUserIdentity.length
  const unregisteredCommunities = useSelector(identity.selectors.unregisteredCommunities)
  const isUnregisteredCommunity = unregisteredCommunities.length

  const isConnected = useSelector(socketSelectors.isConnected)
  const isOwner = useSelector(communities.selectors.isOwner)

  useEffect(() => {
    if (isConnected && isCommunityWithoutUserIdentity && !isCreateUserNameStarted) {
      let communityAction: CommunityAction
      isOwner ? communityAction = CommunityAction.Create : communityAction = CommunityAction.Join
      setIsRetryingRegistration(true)
      createUsernameModal.handleOpen({
        communityAction: communityAction,
        communityData: communitiesWithoutUserIdentity[0].registrarUrl
      })
    }
  }, [communitiesWithoutUserIdentity, isConnected, isCreateUserNameStarted])

  useEffect(() => {
    let communityMessage: LoadingMessages

    if (isUnregisteredCommunity && !loadingCommunityModal.open) {
      isOwner ? communityMessage = LoadingMessages.CreateCommunity : communityMessage = LoadingMessages.JoinCommunity
      loadingCommunityModal.handleOpen({
        message: communityMessage
      })
    }
  }, [unregisteredCommunities])
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
  }, [channels.length, invitationUrl, certificate, allCommunitiesInitialized, communitiesWithoutUserIdentity, unregisteredCommunities])

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
      dispatch(communities.actions.removeUnregisteredCommunity(communitiesWithoutUserIdentity[0]))
      action =
        createUsernameModal.communityAction === CommunityAction.Create
          ? communities.actions.createNewCommunity(communitiesWithoutUserIdentity[0].name)
          : communities.actions.joinCommunity(communitiesWithoutUserIdentity[0].registrarUrl)
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
    <CreateUsernameModalComponent
      {...createUsernameModal}
      handleRegisterUsername={handleAction}
      certificateRegistrationError={error?.message}
      certificate={certificate}
    />
  )
}

export default CreateUsernameModal
