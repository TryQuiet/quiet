import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'

import { typeRejected, LoaderState, FetchingState } from './utils'
import { getClient } from '../../zcash'
import { actionTypes } from '../../../shared/static'

const DEFAULT_ADDRESS_TYPE = 'sapling'

export const NodeState = Immutable.Record({
  latestBlock: new BigNumber(0),
  currentBlock: new BigNumber(0),
  connections: new BigNumber(0),
  isTestnet: null,
  status: 'connecting',
  errors: '',
  bootstrapLoader: LoaderState(),
  fetchingStatus: FetchingState(),
  startedAt: null
}, 'NodeState')

export const initialState = NodeState()

const setStatus = createAction(actionTypes.SET_STATUS, null, { ignoreError: true })

const createAddress = createAction(
  actionTypes.CREATE_ADDRESS,
  async (type = DEFAULT_ADDRESS_TYPE) => {
    return getClient().addresses.create(type)
  }
)

const setBootstrapping = createAction(actionTypes.SET_BOOTSTRAPPING)
const setBootstrappingMessage = createAction(actionTypes.SET_BOOTSTRAPPING_MESSAGE)

const setFetchingPart = createAction(actionTypes.SET_FETCHING_PART)
const setFetchingSizeLeft = createAction(actionTypes.SET_FETCHING_SIZE_LEFT)
const setFetchingStatus = createAction(actionTypes.SET_FETCHING_STATUS)
const setFetchingSpeed = createAction(actionTypes.SET_FETCHING_SPEED)
const setFetchingEndTime = createAction(actionTypes.SET_FETCHING_END_TIME)

const actions = {
  createAddress,
  setBootstrapping,
  setBootstrappingMessage,
  setFetchingPart,
  setFetchingSizeLeft,
  setFetchingStatus,
  setFetchingEndTime,
  setFetchingSpeed
}

const getStatus = () => async (dispatch) => {
  try {
    const info = await getClient().status.info()
    dispatch(setStatus(info))
  } catch (err) {
    console.log(err)
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
  [setBootstrappingMessage]: (state, { payload: message }) => state.setIn(['bootstrapLoader', 'message'], message),
  [setFetchingPart]: (state, { payload: message }) => state.setIn(['fetchingStatus', 'part'], message),
  [setFetchingSizeLeft]: (state, { payload: sizeLeft }) => state.setIn(['fetchingStatus', 'sizeLeft'], sizeLeft),
  [setFetchingStatus]: (state, { payload: fetchingStatus }) => state.setIn(['fetchingStatus', 'fetchingStatus'], fetchingStatus),
  [setFetchingSpeed]: (state, { payload: fetchingSpeed }) => state.setIn(['fetchingStatus', 'fetchingSpeed'], fetchingSpeed),
  [setFetchingEndTime]: (state, { payload: fetchingEndTime }) => state.setIn(['fetchingStatus', 'fetchingEndTime'], fetchingEndTime)
}, initialState)

export default {
  actions,
  reducer,
  epics
}
