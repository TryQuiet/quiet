import React from 'react'
import { useSelector } from 'react-redux'
import { remote } from 'electron'

import ErrorModal from '../../components/ui/ErrorModal/ErrorModal'
import criticalErrorSelectors from '../../store/selectors/criticalError'
import { useModal, ModalName } from '../../store/handlers/modals'

export const useErrorModalData = () => {
  const data = {
    message: useSelector(criticalErrorSelectors.message),
    traceback: useSelector(criticalErrorSelectors.traceback)
  }
  return data
}

export const useErrorModalActions = () => {
  const restartApp = () => {
    remote.app.relaunch()
    remote.app.quit()
  }
  return { restartApp }
}

const ErrorModalContainer = () => {
  const { message, traceback } = useErrorModalData()
  const { restartApp } = useErrorModalActions()
  const modal = useModal(ModalName.quitApp)

  return (
    <ErrorModal
      message={message}
      traceback={traceback}
      open={modal.open}
      handleExit={modal.handleClose}
      restartApp={restartApp}
    />
  )
}

export default ErrorModalContainer
