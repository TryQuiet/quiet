import { produce, immerable } from 'immer'
import { remote } from 'electron'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

import { ActionsType, PayloadType } from './types'

export class App {
  version: string
  newUser: boolean
  modalTabToOpen: string
  isInitialLoadFinished: boolean

  constructor(values?: Partial<App>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: App = {
  ...new App({
    version: null,
    newUser: false,
    modalTabToOpen: '',
    isInitialLoadFinished: false
  })
}

const loadVersion = createAction(actionTypes.SET_APP_VERSION, () => remote.app.getVersion())
const setModalTab = createAction<string>(actionTypes.SET_CURRENT_MODAL_TAB)
const clearModalTab = createAction<null>(actionTypes.CLEAR_CURRENT_MODAL_TAB)

export const actions = {
  loadVersion,
  setModalTab,
  clearModalTab
}

export type AppActions = ActionsType<typeof actions>

export const reducer = handleActions<App, PayloadType<AppActions>>(
  {
    [loadVersion.toString()]: (state, { payload: version }: AppActions['loadVersion']) =>
      produce(state, draft => {
        draft.version = version
      }),
    [setModalTab.toString()]: (state, { payload: tabName }: AppActions['setModalTab']) =>
      produce(state, draft => {
        draft.modalTabToOpen = tabName
      }),
    [clearModalTab.toString()]: state =>
      produce(state, draft => {
        draft.modalTabToOpen = null
      })
  },
  initialState
)

export default {
  actions,
  reducer
}
