import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'

import { typeRejected, LoaderState } from './utils'
import { getClient } from '../../zcash'

const DEFAULT_ADDRESS_TYPE = 'sapling'

export const NodeState = Immutable.Record({
  latestBlock: new BigNumber(0),
  currentBlock: new BigNumber(0),
  connections: new BigNumber(0),
  isTestnet: null,
  status: 'connecting',
  errors: '',
  bootstrapLoader: LoaderState(),
  startedAt: null
}, 'NodeState')

export const initialState = NodeState()

export const actionTypes = {
  GET_STATUS: 'GET_NODE_STATUS',
  CREATE_ADDRESS: 'CREATE_ZCASH_ADDRESS',
  GET_BALANCE: 'GET_BALANCE',
  SET_STATUS: 'SET_NODE_STATUS',
  SET_BOOTSTRAPPING: 'SET_NODE_BOOTSTRAPPING',
  SET_BOOTSTRAPPING_MESSAGE: 'SET_NODE_BOOTSTRAPPING_MESSAGE'
}

const setStatus = createAction(actionTypes.SET_STATUS)

const createAddress = createAction(
  actionTypes.CREATE_ADDRESS,
  async (type = DEFAULT_ADDRESS_TYPE) => {
    return getClient().addresses.create(type)
  }
)

const setBootstrapping = createAction(actionTypes.SET_BOOTSTRAPPING)
const setBootstrappingMessage = createAction(actionTypes.SET_BOOTSTRAPPING_MESSAGE)

const actions = {
  createAddress,
  setBootstrapping,
  setBootstrappingMessage
}

const getStatus = () => async (dispatch) => {
  try {
    const info = await getClient().status.info()
    dispatch(setStatus(info))
  } catch (err) {
    dispatch(setStatus({ 'status': 'down', errors: err }))
  }
}

const restart = () => (dispatch) => {
  console.log('Restarting node')
}

const togglePower = () => (dispatch) => {
  console.log('toggling power of the node')
}

const epics = {
  getStatus,
  restart,
  togglePower
}

export const reducer = handleActions({
  [actionTypes.SET_STATUS]: (state, { payload: status }) => state.merge(status),
  [typeRejected(actionTypes.CREATE_ADDRESS)]: (state, { payload: errors }) => state.set('errors', errors),
  [setBootstrapping]: (state, { payload: bootstrapping }) => state.setIn(['bootstrapLoader', 'loading'], bootstrapping),
  [setBootstrappingMessage]: (state, { payload: message }) => state.setIn(['bootstrapLoader', 'message'], message)
}, initialState)

export default {
  actions,
  reducer,
  epics
}
