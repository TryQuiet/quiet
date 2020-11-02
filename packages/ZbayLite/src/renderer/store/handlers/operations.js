import { produce } from 'immer'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'
// import contactsSelector from '../../store/selectors/contacts'
import { updatePendingMessage } from '../../store/handlers/contacts'

import { actionTypes } from '../../../shared/static'

const oneOf = (...arr) => val => R.includes(val, arr)

export const isFinished = oneOf('success', 'cancelled', 'failed')

export const initialState = {}

export const ZcashError = {
  code: null,
  message: ''
}

export const ShieldBalanceOp = {
  amount: new BigNumber(0),
  from: '',
  to: ''
}

export const PendingMessageOp = {
  message: {},
  channelId: ''
}

export const PendingDirectMessageOp = {
  message: {},
  recipientAddress: '',
  recipientUsername: '',
  offerId: ''
}

export const operationTypes = {
  shieldBalance: 'shieldBalance',
  pendingMessage: 'pendingMessage',
  pendingDirectMessage: 'pendingDirectMessage',
  pendingPlainTransfer: 'pendingPlainTransfer'
}

export const Operation = {
  id: '',
  txid: '',
  error: null
}

const addOperation = createAction(actionTypes.ADD_PENDING_OPERATION)
const resolveOperation = createAction(actionTypes.RESOLVE_PENDING_OPERATION)
const removeOperation = createAction(actionTypes.REMOVE_PENDING_OPERATION)

export const actions = {
  addOperation,
  resolveOperation,
  removeOperation
}

const observeOperation = ({
  opId,
  type,
  meta,
  checkConfirmationNumber
}) => async (dispatch, getState) => {
  dispatch(addOperation({ opId, type, meta }))
}
const resolvePendingOperation = ({
  channelId,
  id,
  txid,
  error = null
}) => async (dispatch, getState) => {
  dispatch(updatePendingMessage({ id, txid, key: channelId }))
  dispatch(resolveOperation({ id, txid, channelId }))
}
export const epics = {
  observeOperation,
  resolvePendingOperation
}

export const reducer = handleActions(
  {
    [addOperation]: (state, { payload: { channelId, id } }) =>
      produce(state, (draft) => {
        draft[channelId] = {}
        draft[channelId][id] = {
          ...Operation,
          id
        }
      }),
    [resolveOperation]: (
      state,
      { payload: { channelId, id, txid, error = null } }
    ) =>
      produce(state, (draft) => {
        delete draft[channelId][id]
        draft[channelId][txid] = {
          ...Operation,
          id,
          txid
        }
      })
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
