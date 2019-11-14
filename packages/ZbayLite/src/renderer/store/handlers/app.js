import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import { remote } from 'electron'

export const AppState = Immutable.Record(
  {
    version: null,
    transfers: Immutable.Map(),
    newUser: false,
    modalTabToOpen: null
  },
  'AppState'
)

export const initialState = AppState()

const loadVersion = createAction('SET_APP_VERSION', () => remote.app.getVersion())
const setTransfers = createAction('SET_TRANSFERS')
const setNewUser = createAction('SET_NEW_USER')
const setModalTab = createAction('SET_CURRENT_MODAL_TAB')
const clearModalTab = createAction('CLEAR_CURRENT_MODAL_TAB')

export const actions = {
  loadVersion,
  setTransfers,
  setNewUser,
  setModalTab,
  clearModalTab
}

export const reducer = handleActions(
  {
    [loadVersion]: (state, { payload: version }) => state.set('version', version),
    [setModalTab]: (state, { payload: tabName }) => state.set('modalTabToOpen', tabName),
    [clearModalTab]: (state) => state.set('modalTabToOpen', null),
    [setNewUser]: (state, { payload: newUser }) => state.set('newUser', newUser),
    [setTransfers]: (state, { payload: { id, value } }) => {
      return state.setIn(['transfers', id], value)
    }
  },
  initialState
)

export default {
  actions,
  reducer
}
