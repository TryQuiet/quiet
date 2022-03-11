import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { socketSelectors } from '../../sagas/socket/socket.selectors'
import { ErrorCodes, errors, identity, socketActionTypes } from '@quiet/nectar'
import CreateUsernameComponent from '../CreateUsername/CreateUsernameComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'
import { LoadingMessages } from '../../containers/widgets/loadingPanel/loadingMessages'

const CreateUsername = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const createUsernameModal = useModal(ModalName.createUsernameModal)

  const loadingStartApp = useModal(ModalName.loadingPanel)

  const error = useSelector(errors.selectors.registrarErrors)

  useEffect(() => {
    if (!isConnected && createUsernameModal.open) {
      loadingStartApp.handleOpen({
        message: LoadingMessages.StartApp
      })
    } else {
      loadingStartApp.handleClose()
    }
  }, [isConnected])

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
      certificateRegistrationError={error?.message}
      certificate={currentIdentity?.userCertificate}
    />
  )
}

export default CreateUsername
