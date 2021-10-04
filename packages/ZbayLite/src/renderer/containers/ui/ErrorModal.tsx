import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { remote } from 'electron'

import ErrorModal from '../../components/ui/ErrorModal/ErrorModal'
import criticalErrorSelectors from '../../store/selectors/criticalError'
import { useModal, ModalName } from '../../store/handlers/modals'
import notificationsHandlers from '../../store/handlers/notifications'
import { successNotification, errorNotification } from '../../store/handlers/utils'

export const useErrorModalData = () => {
  const data = {
    message: useSelector(criticalErrorSelectors.message),
    traceback: useSelector(criticalErrorSelectors.traceback)
  }
  return data
}

export const useErrorModalActions = () => {
  const dispatch = useDispatch()
  const successSnackbar = () =>
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({
          message: 'Message has been sent'
        })
      )
    )
  const errorSnackbar = () =>
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: 'There was an error'
        })
      )
    )
  const restartApp = () => {
    remote.app.relaunch()
    remote.app.quit()
  }
  return { successSnackbar, errorSnackbar, restartApp }
}

const ErrorModalContainer = () => {
  const { message, traceback } = useErrorModalData()
  const { successSnackbar, errorSnackbar, restartApp } = useErrorModalActions()
  const modal = useModal(ModalName.quitApp)

  return (
    <ErrorModal
      message={message}
      traceback={traceback}
      open={modal.open}
      handleExit={modal.handleClose}
      successSnackbar={successSnackbar}
      errorSnackbar={errorSnackbar}
      restartApp={restartApp}
    />
  )
}

export default ErrorModalContainer
