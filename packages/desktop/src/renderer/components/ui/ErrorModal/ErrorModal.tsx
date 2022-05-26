import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { communities, publicChannels, users, identity } from '@quiet/state-manager'
import ErrorModalComponent from './ErrorModalComponent'
import { modalsActions } from '../../../sagas/modals/modals.slice'

export enum LoadingPanelMessage {
  StartingApplication = 'Starting Quiet',
  FetchingData = 'Fetching Data'
}

const ErrorModal = () => {

  const modal = useModal(ModalName.criticalError)
  
  return <ErrorModalComponent open={modal.open} handleClose={modal.handleClose}/>
}

export default ErrorModal
