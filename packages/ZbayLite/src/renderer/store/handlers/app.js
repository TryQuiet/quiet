import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import { remote } from 'electron'

export const AppState = Immutable.Record({
  version: null
}, 'AppState')

export const initialState = AppState()

const loadVersion = createAction('SET_APP_VERSION', remote.app.getVersion)

const actions = {
  loadVersion
}

export const reducer = handleActions({
  [loadVersion]: (state, { payload: version }) => state.set('version', version)
}, initialState)

export default {
  actions,
  reducer
}
