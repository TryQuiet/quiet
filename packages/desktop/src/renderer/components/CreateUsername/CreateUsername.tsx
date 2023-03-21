import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { errors, identity, ErrorCodes } from '@quiet/state-manager'
import CreateUsernameComponent from '../CreateUsername/CreateUsernameComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'

const CreateUsername = () => {
  const dispatch = useDispatch()

  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const createUsernameModal = useModal(ModalName.createUsernameModal)

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
      dispatch(
        errors.actions.clearError(error)
      )
    }
    dispatch(identity.actions.registerUsername(nickname))
  }

  return (
    <CreateUsernameComponent
      {...createUsernameModal}
      registerUsername={handleAction}
      certificateRegistrationError={error?.code === ErrorCodes.FORBIDDEN ? error.message : null}
      certificate={currentIdentity?.userCertificate}
    />
  )
}

export default CreateUsername
