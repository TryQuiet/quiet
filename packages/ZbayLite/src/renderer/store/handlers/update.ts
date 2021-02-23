import { ipcRenderer } from 'electron'
import { actionCreators } from './modals'

export const checkForUpdate = () => async dispatch => {
  dispatch(actionCreators.openModal('applicationUpdate')())
}

export const startApplicationUpdate = () => async dispatch => {
  ipcRenderer.send('proceed-update')
  dispatch(actionCreators.closeModal('applicationUpdate')())
}

export const declineUpdate = () => async dispatch => {
  dispatch(actionCreators.closeModal('applicationUpdate')())
}

export const epics = {
  checkForUpdate,
  startApplicationUpdate,
  declineUpdate
}

export default {
  epics
}
