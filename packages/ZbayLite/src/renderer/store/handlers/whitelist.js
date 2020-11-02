import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'

import { actionTypes } from '../../../shared/static'
import electronStore from '../../../shared/electronStore'
import logsHandlers from '../../../renderer/store/handlers/logs'

const Whitelist = {
  allowAll: false,
  whitelisted: [],
  autoload: []
}

export const initialState = {
  ...Whitelist
}

const setWhitelist = createAction(actionTypes.SET_WHITELIST)
const setWhitelistAllFlag = createAction(actionTypes.SET_WHITELIST_ALL_FLAG)
const setAutoLoadList = createAction(actionTypes.SET_AUTO_LOAD_LIST)

export const actions = {
  setWhitelist,
  setWhitelistAllFlag,
  setAutoLoadList
}
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
  dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Setting new privder: ${url}` }))
}
export const setWhitelistAll = allowAll => async (dispatch, getState) => {
  ensureStore()
  electronStore.set('whitelist.allowAll', allowAll)
  dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Setting auto loading for all links` }))
  dispatch(setWhitelistAllFlag(allowAll))
}
export const setAutoLoad = newLink => async (dispatch, getState) => {
  ensureStore()
  const autoloadArray = electronStore.get('whitelist.autoload')
  if (autoloadArray.indexOf(newLink) === -1) {
    autoloadArray.push(newLink)
  }
  electronStore.set('whitelist.autoload', autoloadArray)
  dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Setting new auto load link  ${newLink}` }))
  dispatch(setAutoLoadList(autoloadArray))
}
export const removeImageHost = hostname => async (dispatch, getState) => {
  ensureStore()
  const autoloadArray = electronStore.get('whitelist.autoload')
  const filteredArray = autoloadArray.filter(name => name !== hostname)
  electronStore.set('whitelist.autoload', filteredArray)
  dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Removing image host host ${hostname}` }))
  dispatch(setAutoLoadList(filteredArray))
}
export const removeSiteHost = hostname => async (dispatch, getState) => {
  ensureStore()
  const whitelistedArray = electronStore.get('whitelist.whitelisted')
  const filteredArray = whitelistedArray.filter(name => name !== hostname)
  electronStore.set('whitelist.whitelisted', filteredArray)
  dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Removing site host ${hostname}` }))
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
export const reducer = handleActions(
  {
    [setWhitelist]: (state, { payload: list }) =>
      produce(state, (draft) => {
        draft.whitelisted = list
      }),
    [setAutoLoadList]: (state, { payload: list }) =>
      produce(state, (draft) => {
        draft.autoload = list
      }),
    [setWhitelistAllFlag]: (state, { payload: flag }) =>
      produce(state, (draft) => {
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
