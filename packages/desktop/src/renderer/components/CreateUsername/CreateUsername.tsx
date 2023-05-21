import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { errors, identity, ErrorCodes, network, LoadingPanelType } from '@quiet/state-manager'
import CreateUsernameComponent from '../CreateUsername/CreateUsernameComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'

const CreateUsername = () => {
  const dispatch = useDispatch()

  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const error = useSelector(errors.selectors.registrarErrors)

  useEffect(() => {
    if (currentIdentity && !currentIdentity.userCertificate && !createUsernameModal.open) {
      createUsernameModal.handleOpen()
    }
    if (currentIdentity?.userCertificate && createUsernameModal.open) {
      createUsernameModal.handleClose()
    }
  }, [currentIdentity])

  const handleAction = (nickname: string) => {
    // Clear errors
    if (error) {
      dispatch(errors.actions.clearError(error))
    }

    dispatch(identity.actions.registerUsername(nickname))
    dispatch(network.actions.setLoadingPanelType(LoadingPanelType.Joining))
    loadingPanelModal.handleOpen()
  }

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
