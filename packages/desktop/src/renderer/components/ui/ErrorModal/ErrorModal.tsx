import React, { useEffect, useState } from 'react'
import { ipcRenderer } from 'electron'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { communities, publicChannels, users, identity } from '@quiet/state-manager'
import ErrorModalComponent from './ErrorModalComponent'
import { modalsActions } from '../../../sagas/modals/modals.slice'

export const ErrorModal = () => {
  const modal = useModal<{
    message: string
    traceback: string
  }>(ModalName.criticalError)

  const restartApp = () => {
    ipcRenderer.send('restartApp')
  }

  return <ErrorModalComponent open={modal.open} handleClose={modal.handleClose} traceback={modal.traceback} message={modal.message} restartApp={restartApp}/>
}

export default ErrorModal
