import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ErrorCodes, LoadingPanelType } from '@quiet/types'
import { communities, errors, identity, network } from '@quiet/state-manager'
import CreateUsernameComponent from '../CreateUsername/CreateUsernameComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'

const CreateUsername = () => {
  const dispatch = useDispatch()

  const [ username, setUsername ] = useState<string | undefined>(undefined)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const isOwner = Boolean(currentCommunity?.CA)

  const networkCreated = Boolean(currentCommunity && !currentIdentity?.userCertificate)

  const usernameRegistered = currentIdentity?.nickname == username

  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const error = useSelector(errors.selectors.registrarErrors)

  useEffect(() => {
    if (networkCreated && !createUsernameModal.open) {
      createUsernameModal.handleOpen()
    }
    if (currentIdentity?.userCsr && createUsernameModal.open) {
      createUsernameModal.handleClose()
    }
  }, [currentIdentity, currentCommunity])

  const handleAction = (nickname: string) => {
    // Clear errors
    if (error) {
      dispatch(errors.actions.clearError(error))
    }

    setUsername(nickname)

    dispatch(
      identity.actions.chooseUsername({
        nickname,
      })
    )
    dispatch(network.actions.setLoadingPanelType(LoadingPanelType.Joining))
    loadingPanelModal.handleOpen()
  }

  useEffect(() => {
    if (usernameRegistered) {
      if (isOwner) {
        // Register own certificate
        dispatch(identity.actions.registerCertificate())
      } else {
        // Save user csr to the database
        dispatch(identity.actions.saveUserCsr())
      }
      dispatch(communities.actions.launchCommunity())

      dispatch(network.actions.setLoadingPanelType(LoadingPanelType.Joining))
      loadingPanelModal.handleOpen()
    }
  }, [dispatch, username, currentIdentity])

  return (
    <CreateUsernameComponent
      {...createUsernameModal}
      registerUsername={handleAction}
      certificateRegistrationError={error?.code === ErrorCodes.FORBIDDEN ? error.message : undefined}
      certificate={currentIdentity?.userCertificate}
    />
  )
}

export default CreateUsername
