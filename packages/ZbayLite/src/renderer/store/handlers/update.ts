import { ipcRenderer } from 'electron'
import { actionCreators, ModalName } from './modals'

export const checkForUpdate = () => async dispatch => {
  dispatch(actionCreators.openModal(ModalName.applicationUpdate)())
}

export const startApplicationUpdate = () => async dispatch => {
  ipcRenderer.send('proceed-update')
  dispatch(actionCreators.closeModal(ModalName.applicationUpdate)())
}

export const declineUpdate = () => async dispatch => {
  dispatch(actionCreators.closeModal(ModalName.applicationUpdate)())
}

export const epics = {
  checkForUpdate,
  startApplicationUpdate,
  declineUpdate
}

export default {
  epics
}
