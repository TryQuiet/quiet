import { ipcRenderer } from 'electron'
import React from 'react'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import ErrorModalComponent from './ErrorModalComponent'

export const ErrorModal = () => {
  const modal = useModal<{
    message: string
    traceback: string
  }>(ModalName.criticalError)

  const restartApp = () => {
    ipcRenderer.send('restartApp')
  }

  const testMode = Boolean(process.env.TEST_MODE)

  return <ErrorModalComponent open={modal.open} handleClose={modal.handleClose} traceback={modal.traceback} message={modal.message} restartApp={restartApp} testMode={testMode}/>
}

export default ErrorModal
