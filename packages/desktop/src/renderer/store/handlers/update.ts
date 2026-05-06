import { ipcRenderer } from 'electron'
import { ModalName } from '../../sagas/modals/modals.types'
import { modalsActions } from '../../sagas/modals/modals.slice'
import { AnyAction, Dispatch } from 'redux'

export const openUpdateModal = () => async (dispatch: Dispatch<AnyAction>) => {
  dispatch(modalsActions.openModal({ name: ModalName.applicationUpdate }))
}

export const startApplicationUpdate = () => async (dispatch: Dispatch<AnyAction>) => {
  ipcRenderer.send('proceed-update')
  dispatch(modalsActions.closeModal(ModalName.applicationUpdate))
}

export const declineUpdate = () => async (dispatch: Dispatch<AnyAction>) => {
  dispatch(modalsActions.closeModal(ModalName.applicationUpdate))
}

export const epics = {
  openUpdateModal,
  startApplicationUpdate,
  declineUpdate,
}

export default {
  epics,
}
