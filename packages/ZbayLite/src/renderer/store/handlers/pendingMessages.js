import Immutable from 'immutable'
import * as R from 'ramda'
import { createAction, handleActions } from 'redux-actions'

import { getClient } from '../../zcash'

const oneOf = (...arr) => val => R.includes(val, arr)

const isFinished = oneOf('success', 'cancelled', 'failed')

const POLLING_OFFSET = 15000

export const initialState = Immutable.Map()

export const ZcashError = Immutable.Record({
  code: null,
  message: ''
}, 'ZcashError')

export const PendingMessage = Immutable.Record({
  opId: null,
  channelId: null,
  txId: null,
  error: null,
  message: Immutable.Map(),
  status: 'pending'
}, 'PendingMessage')

const addMessage = createAction('ADD_PENDING_MESSAGE')
const resolveMessage = createAction('RESOLVE_PENDING_MESSAGE')
const removeMessage = createAction('REMOVE_PENDING_MESSAGE')

export const actions = {
  addMessage,
  removeMessage,
  resolveMessage
}

const observeMessage = ({ opId, channelId, message }) => async (dispatch) => {
  dispatch(addMessage({ opId, channelId, message }))

  const subscribe = async (callback) => {
    async function poll () {
      const {
        status,
        result: { txid: txId } = {},
        error = null
      } = await getClient().operations.getStatus(opId)
      if (isFinished(status)) {
        return callback(error, { status, txId })
      } else {
        setTimeout(poll, POLLING_OFFSET)
      }
    }
    return poll()
  }

  return subscribe((error, { status, txId }) => {
    dispatch(resolveMessage({ opId, status, txId, error }))
  })
}

export const epics = {
  observeMessage
}

export const reducer = handleActions({
  [addMessage]: (state, { payload: { channelId, message, opId } }) => state.set(
    opId,
    PendingMessage({
      opId,
      channelId,
      message: Immutable.fromJS(message)
    })
  ),
  [resolveMessage]: (state, { payload: { opId, status, txId, error } }) => state.update(
    opId,
    m => m.merge({
      status,
      txId,
      error: error ? ZcashError(error) : null
    })
  ),
  [removeMessage]: (state, { payload: msgId }) => {
    if (state.has(msgId)) {
      return state.delete(msgId)
    }
    // It may be a txId
    return state.filter(pm => pm.txId !== msgId)
  }
}, initialState)

export default {
  actions,
  epics,
  reducer
}
