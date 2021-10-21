import { ipcRenderer } from 'electron'
import { ModalName } from '../../sagas/modals/modals.types'
import { modalsActions } from '../../sagas/modals/modals.slice'

export const checkForUpdate = () => async dispatch => {
  dispatch(modalsActions.openModal(ModalName.applicationUpdate))
}

export const startApplicationUpdate = () => async dispatch => {
  ipcRenderer.send('proceed-update')
  dispatch(modalsActions.closeModal(ModalName.applicationUpdate))
}

export const declineUpdate = () => async dispatch => {
  dispatch(modalsActions.closeModal(ModalName.applicationUpdate))
}

export const epics = {
  checkForUpdate,
  startApplicationUpdate,
  declineUpdate
}

export default {
  epics
}
