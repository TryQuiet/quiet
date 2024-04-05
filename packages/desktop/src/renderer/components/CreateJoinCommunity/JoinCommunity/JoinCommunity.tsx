import { communities, connection, errors, identity } from '@quiet/state-manager'
import { CommunityOwnership, InvitationData, SocketActionTypes } from '@quiet/types'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PerformCommunityActionComponent from '../../../components/CreateJoinCommunity/PerformCommunityActionComponent'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { errors as errorsState } from '@quiet/state-manager'

const JoinCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)

  const torBootstrapProcessSelector = useSelector(connection.selectors.torBootstrapProcess)

  const downloadInviteDataError = useSelector(
    errors.selectors.generalErrorByType(SocketActionTypes.DOWNLOAD_INVITE_DATA)
  )

  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)
  const [serverErrorMessage, setServerErrorMessage] = useState<string>('')

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
    dispatch(communities.actions.joinNetwork(data))
  }

  // From 'You can create a new community instead' link
  const handleRedirection = () => {
    if (!createCommunityModal.open) {
      createCommunityModal.handleOpen()
    } else {
      joinCommunityModal.handleClose()
    }
  }

  useEffect(() => {
    if (downloadInviteDataError?.message) {
      setServerErrorMessage(downloadInviteDataError.message)
    }
  }, [downloadInviteDataError])

  const clearServerError = () => {
    if (downloadInviteDataError) {
      dispatch(errorsState.actions.clearError(downloadInviteDataError))
      setServerErrorMessage('')
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
      serverErrorMessage={serverErrorMessage}
      clearServerError={clearServerError}
    />
  )
}

export default JoinCommunity
