import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, errors, identity, socketActionTypes } from '@quiet/nectar'
import CreateUsernameComponent from '../CreateUsername/CreateUsernameComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'
import { CommunityAction } from '../CreateJoinCommunity/community.keys'

export interface CreateUsernameProps {
  communityAction: CommunityAction
  communityData: string
}

const CreateUsername = () => {
  const dispatch = useDispatch()

  const [username, setUsername] = useState('')

  const interruptedRegistration = useSelector(identity.selectors.interruptedRegistration)

  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const certificate = useSelector(identity.selectors.currentIdentity)?.userCertificate

  const communityErrors = useSelector(errors.selectors.currentCommunityErrors)
  let error = communityErrors[socketActionTypes.REGISTRAR]

  const createUsernameModal = useModal<CreateUsernameProps>(ModalName.createUsernameModal)
  const loadingPanel = useModal(ModalName.loadingPanel)

  useEffect(() => {
    if (interruptedRegistration) {
      loadingPanel.handleOpen({
        message: 'Continuing username registration'
      })
    }
  }, []) // Verify

  // Add logic for closing loadingPanel
  // Add logic for redirecting after successfull registration

  useEffect(() => {
    if (error?.code === 500) {
      error = undefined
    }
  }, [error]) // Verify

  // Move to nectar
  useEffect(() => {
    if (currentIdentity?.hiddenService && !certificate) {
      dispatch(identity.actions.registerUsername(username))
    }
  }, [currentIdentity?.hiddenService])


  const handleAction = (nickname: string) => {
    setUsername(nickname)

    const value = createUsernameModal.communityData

    const action =
      createUsernameModal.communityAction === CommunityAction.Create
        ? communities.actions.createNewCommunity(value) // Reuse already existing entities instead of creating new ones
        : communities.actions.joinCommunity(value)

    dispatch(action)
  }

  return (
    <CreateUsernameComponent
      {...createUsernameModal}
      registerUsername={handleAction}
      certificateRegistrationError={error?.message}
      certificate={certificate}
      />
  )
}

export default CreateUsername
