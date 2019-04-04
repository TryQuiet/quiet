import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'

import { typeFulfilled, typeRejected } from './utils'
import { getClient } from '../../zcash'

export const NodeState = Immutable.Record({
  latestBlock: new BigNumber(0),
  currentBlock: new BigNumber(0),
  connections: new BigNumber(0),
  status: 'connecting',
  errors: '',
  startedAt: null
}, 'NodeState')

export const initialState = NodeState()

export const actionTypes = {
  GET_STATUS: 'GET_NODE_STATUS',
  CREATE_ADDRESS: 'CREATE_ZCASH_ADDRESS',
  GET_BALANCE: 'GET_BALANCE'
}

// TODO: using return with arrow functions because otherwise mocks in test fail
// since getClient() is evaluated when module is loaded, not on call
const getStatus = createAction(
  actionTypes.GET_STATUS,
  async () => {
    return getClient().status.info()
  }
)

const createAddress = createAction(
  actionTypes.CREATE_ADDRESS,
  async (type = 'sapling') => {
    return getClient().addresses.create(type)
  }
)

const actions = {
  getStatus,
  createAddress
}

const restart = () => (dispatch) => {
  console.log('Restarting node')
}

const togglePower = () => (dispatch) => {
  console.log('toggling power of the node')
}

const epics = {
  restart,
  togglePower
}

export const reducer = handleActions({
  [typeFulfilled(actionTypes.GET_STATUS)]: (state, { payload: status }) => state.merge(status),
  [typeRejected(actionTypes.GET_STATUS)]: (state, { payload: errors }) => NodeState().merge({
    status: 'down',
    errors
  }),
  [typeRejected(actionTypes.CREATE_ADDRESS)]: (state, { payload: errors }) => state.set('errors', errors)
}, initialState)

export default {
  actions,
  reducer,
  epics
}
