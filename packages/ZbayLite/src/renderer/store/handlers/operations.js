import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'
// import contactsSelector from '../../store/selectors/contacts'
import { updatePendingMessage } from '../../store/handlers/contacts'

import { actionTypes } from '../../../shared/static'

const oneOf = (...arr) => val => R.includes(val, arr)

export const isFinished = oneOf('success', 'cancelled', 'failed')

export const initialState = Immutable.Map()

export const ZcashError = Immutable.Record(
  {
    code: null,
    message: ''
  },
  'ZcashError'
)

export const ShieldBalanceOp = Immutable.Record({
  amount: new BigNumber(0),
  from: '',
  to: ''
})

export const PendingMessageOp = Immutable.Record({
  message: Immutable.Map(),
  channelId: ''
})

export const PendingDirectMessageOp = Immutable.Record({
  message: Immutable.Map(),
  recipientAddress: '',
  recipientUsername: '',
  offerId: ''
})

export const operationTypes = {
  shieldBalance: 'shieldBalance',
  pendingMessage: 'pendingMessage',
  pendingDirectMessage: 'pendingDirectMessage',
  pendingPlainTransfer: 'pendingPlainTransfer'
}

export const Operation = Immutable.Record(
  {
    id: '',
    txid: '',
    error: null
  },
  'Operation'
)

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
      state.setIn(
        [channelId, id],
        Operation({
          id
        })
      ),
    [resolveOperation]: (
      state,
      { payload: { channelId, id, txid, error = null } }
    ) =>
      state.update(channelId, m =>
        m.delete(id).merge({
          [txid]: Operation({
            id,
            txid
          })
        })
      ),
    [removeOperation]: (state, { payload: { channelId, txid } }) => {
      return state.update(channelId, ch => ch.filter(m => m.txid !== txid))
    }
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
