import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import { remote } from 'electron'

export const AppState = Immutable.Record(
  {
    version: null,
    transfers: Immutable.Map(),
    newUser: false
  },
  'AppState'
)

export const initialState = AppState()

const loadVersion = createAction('SET_APP_VERSION', () => remote.app.getVersion())
const setTransfers = createAction('SET_TRANSFERS')
const setNewUser = createAction('SET_NEW_USER')

const actions = {
  loadVersion,
  setTransfers,
  setNewUser
}

export const reducer = handleActions(
  {
    [loadVersion]: (state, { payload: version }) => state.set('version', version),
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
