import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'

import { actionTypes } from '../../../shared/static'
import electronStore from '../../../shared/electronStore'

import { ActionsType, PayloadType } from './types'

class Whitelist {
  allowAll: boolean
  whitelisted: any[]
  autoload: any[]

  constructor(values?: Partial<Whitelist>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: Whitelist = {
  ...new Whitelist({
    allowAll: false,
    whitelisted: [],
    autoload: []
  })
}

const setWhitelist = createAction<any[]>(actionTypes.SET_WHITELIST)
const setWhitelistAllFlag = createAction<boolean>(actionTypes.SET_WHITELIST_ALL_FLAG)
const setAutoLoadList = createAction<any[]>(actionTypes.SET_AUTO_LOAD_LIST)

export const actions = {
  setWhitelist,
  setWhitelistAllFlag,
  setAutoLoadList
}

export type WhitelistActions = ActionsType<typeof actions>


const ensureStore = () => {
  if (!electronStore.get('whitelist')) {
    electronStore.set('whitelist', {
      allowAll: false,
      whitelisted: [],
      autoload: []
    })
  }
}
export const initWhitelist = () => async (dispatch, getState) => {
  ensureStore()
  const whitelist = electronStore.get('whitelist')
  dispatch(setWhitelist(whitelist.whitelisted))
  dispatch(setWhitelistAllFlag(whitelist.allowAll))
  dispatch(setAutoLoadList(whitelist.autoload))
}
export const addToWhitelist = (url, dontAutoload) => async (
  dispatch,
  getState
) => {
  ensureStore()
  const whitelistArray = electronStore.get('whitelist.whitelisted')
  const uri = new URL(url)
  if (whitelistArray.indexOf(uri.hostname) === -1) {
    whitelistArray.push(uri.hostname)
  }
  electronStore.set('whitelist.whitelisted', whitelistArray)
  if (!dontAutoload) {
    dispatch(setAutoLoad(uri.hostname))
  }
  dispatch(setWhitelist(whitelistArray))
}
export const setWhitelistAll = allowAll => async (dispatch, getState) => {
  ensureStore()
  electronStore.set('whitelist.allowAll', allowAll)
  dispatch(setWhitelistAllFlag(allowAll))
}
export const setAutoLoad = newLink => async (dispatch, getState) => {
  ensureStore()
  const autoloadArray = electronStore.get('whitelist.autoload')
  if (autoloadArray.indexOf(newLink) === -1) {
    autoloadArray.push(newLink)
  }
  electronStore.set('whitelist.autoload', autoloadArray)
  dispatch(setAutoLoadList(autoloadArray))
}
export const removeImageHost = hostname => async (dispatch, getState) => {
  ensureStore()
  const autoloadArray = electronStore.get('whitelist.autoload')
  const filteredArray = autoloadArray.filter(name => name !== hostname)
  electronStore.set('whitelist.autoload', filteredArray)
  dispatch(setAutoLoadList(filteredArray))
}
export const removeSiteHost = hostname => async (dispatch, getState) => {
  ensureStore()
  const whitelistedArray = electronStore.get('whitelist.whitelisted')
  const filteredArray = whitelistedArray.filter(name => name !== hostname)
  electronStore.set('whitelist.whitelisted', filteredArray)
  dispatch(setWhitelist(filteredArray))
}
export const epics = {
  addToWhitelist,
  setWhitelistAll,
  setAutoLoad,
  initWhitelist,
  removeImageHost,
  removeSiteHost
}
export const reducer = handleActions<Whitelist, PayloadType<WhitelistActions>>(
  {
    [setWhitelist.toString()]: (state, { payload: list }: WhitelistActions['setWhitelist']) =>
      produce(state, draft => {
        draft.whitelisted = list
      }),
    [setAutoLoadList.toString()]: (state, { payload: list }: WhitelistActions['setAutoLoadList']) =>
      produce(state, draft => {
        draft.autoload = list
      }),
    [setWhitelistAllFlag.toString()]: (
      state,
      { payload: flag }: WhitelistActions['setWhitelistAllFlag']
    ) =>
      produce(state, draft => {
        draft.allowAll = flag
      })
  },
  initialState
)

export default {
  actions,
  reducer,
  epics
}
