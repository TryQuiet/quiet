import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { ipcRenderer } from 'electron'
import { createAction, handleActions } from 'redux-actions'

import { typeRejected, LoaderState, FetchingState } from './utils'
import client from '../../zcash'
import { actionTypes } from '../../../shared/static'
import nodeSelectors from '../selectors/node'

const DEFAULT_ADDRESS_TYPE = 'sapling'

export const NodeState = Immutable.Record(
  {
    latestBlock: new BigNumber(999999),
    currentBlock: new BigNumber(0),
    connections: new BigNumber(0),
    isTestnet: null,
    status: 'healthy',
    errors: '',
    bootstrapLoader: LoaderState(),
    fetchingStatus: FetchingState(),
    startedAt: null,
    isRescanning: false
  },
  'NodeState'
)

export const initialState = NodeState()

const setStatus = createAction(actionTypes.SET_STATUS, null, {
  ignoreError: true
})

const createAddress = createAction(
  actionTypes.CREATE_ADDRESS,
  async (type = DEFAULT_ADDRESS_TYPE) => {
    return client.addresses.create(type)
  }
)

const setBootstrapping = createAction(actionTypes.SET_BOOTSTRAPPING)
const setBootstrappingMessage = createAction(
  actionTypes.SET_BOOTSTRAPPING_MESSAGE
)

const setFetchingPart = createAction(actionTypes.SET_FETCHING_PART)
const setIsRescanning = createAction(actionTypes.SET_IS_RESCANNING)
const setFetchingSizeLeft = createAction(actionTypes.SET_FETCHING_SIZE_LEFT)
const setFetchingStatus = createAction(actionTypes.SET_FETCHING_STATUS)
const setFetchingSpeed = createAction(actionTypes.SET_FETCHING_SPEED)
const setFetchingEndTime = createAction(actionTypes.SET_FETCHING_END_TIME)
const setConnectionStatus = createAction(actionTypes.SET_CONNECTION_STATUS)

const setRescanningProgress = createAction(actionTypes.SET_RESCANNING_PROGRESS)
const setRescanningMonitorStatus = createAction(
  actionTypes.SET_RESCANNING_MONITOR_STATUS
)
const setRescanningStatus = createAction(actionTypes.SET_RESCANNING_STATUS)
const setGuideStatus = createAction(actionTypes.SET_GUIDE_STATUS)
const setNextSlide = createAction(actionTypes.SET_NEXT_SLIDE)
const setPrevSlide = createAction(actionTypes.SET_PREV_SLIDE)

const actions = {
  createAddress,
  setBootstrapping,
  setBootstrappingMessage,
  setFetchingPart,
  setFetchingSizeLeft,
  setFetchingStatus,
  setFetchingEndTime,
  setFetchingSpeed,
  setRescanningProgress,
  setRescanningMonitorStatus,
  setConnectionStatus,
  setRescanningStatus,
  setStatus,
  setGuideStatus,
  setNextSlide,
  setPrevSlide,
  setIsRescanning
}

export const startRescanningMonitor = () => async (dispatch, getState) => {
  ipcRenderer.send('toggle-rescanning-progress-monitor')
  dispatch(setRescanningMonitorStatus(true))
}

export const setRescanningInitialized = () => async (dispatch, getState) => {
  dispatch(setRescanningStatus(true))
}

export const disablePowerSaveMode = () => async (dispatch, getState) => {
  ipcRenderer.send('disable-sleep-prevention')
}

export const checkNodeStatus = nodeProcessStatus => async (
  dispatch,
  getState
) => {
  const nodeResponseStatus = nodeSelectors.status(getState())
  if (nodeProcessStatus === 'up' && nodeResponseStatus === 'down') {
    ipcRenderer.send('restart-node-proc')
  }
}

const getStatus = () => async (dispatch, getState) => {
  try {
    console.log('status')
    const info = await client.info()
    const height = await client.height()
    if (info.latest_block_height > height) {
      dispatch(setStatus({ status: 'syncing' }))
      client.sync()
    } else {
      dispatch(setStatus({ status: 'healthy' }))
    }
    // Check if sync give time cli to start rescan

    setTimeout(async () => {
      const syncStatus = await client.syncStatus()
      if (syncStatus.syncing === 'false') {
        client.save()

        if (nodeSelectors.isRescanning(getState())) {
          setTimeout(async () => {
            console.log('saving')
            console.log(await client.syncStatus())
            await dispatch(setIsRescanning(false))
          }, 10000)
        }
      }
    }, 3000)
    dispatch(
      setStatus({
        latestBlock: new BigNumber(info.latest_block_height),
        currentBlock: new BigNumber(height)
      })
    )
    return info
  } catch (err) {
    console.log(err)
    dispatch(setStatus({ status: 'down', errors: err }))
  }
}

const restart = () => dispatch => {
  console.log('Restarting node')
}

const togglePower = () => dispatch => {
  console.log('toggling power of the node')
}

const epics = {
  getStatus,
  restart,
  togglePower,
  startRescanningMonitor,
  disablePowerSaveMode,
  setRescanningInitialized,
  checkNodeStatus
}

export const reducer = handleActions(
  {
    [actionTypes.SET_STATUS]: (state, { payload: status }) =>
      state.merge(status),
    [typeRejected(actionTypes.CREATE_ADDRESS)]: (state, { payload: errors }) =>
      state.set('errors', errors),
    [setBootstrapping]: (state, { payload: bootstrapping }) =>
      state.setIn(['bootstrapLoader', 'loading'], bootstrapping),
    [setIsRescanning]: (state, { payload: isRescanning }) =>
      state.set('isRescanning', isRescanning),
    [setBootstrappingMessage]: (state, { payload: message }) =>
      state.setIn(['bootstrapLoader', 'message'], message),
    [setFetchingPart]: (state, { payload: message }) =>
      state.setIn(['fetchingStatus', 'part'], message),
    [setFetchingSizeLeft]: (state, { payload: sizeLeft }) =>
      state.setIn(['fetchingStatus', 'sizeLeft'], sizeLeft),
    [setFetchingStatus]: (state, { payload: fetchingStatus }) =>
      state.setIn(['fetchingStatus', 'fetchingStatus'], fetchingStatus),
    [setFetchingSpeed]: (state, { payload: fetchingSpeed }) =>
      state.setIn(['fetchingStatus', 'fetchingSpeed'], fetchingSpeed),
    [setFetchingEndTime]: (state, { payload: fetchingEndTime }) =>
      state.setIn(['fetchingStatus', 'fetchingEndTime'], fetchingEndTime),
    [setConnectionStatus]: (state, { payload: isFetching }) =>
      state.setIn(['fetchingStatus', 'isFetching'], isFetching),
    [setRescanningProgress]: (state, { payload: rescanningProgress }) =>
      state.setIn(['fetchingStatus', 'rescanningProgress'], rescanningProgress),
    [setRescanningMonitorStatus]: (
      state,
      { payload: isRescanningMonitorStarted }
    ) =>
      state.setIn(
        ['fetchingStatus', 'isRescanningMonitorStarted'],
        isRescanningMonitorStarted
      ),
    [setRescanningStatus]: (state, { payload: isRescanningInitialized }) =>
      state.setIn(
        ['fetchingStatus', 'isRescanningInitialized'],
        isRescanningInitialized
      ),
    [setGuideStatus]: (state, { payload: guideStatus }) =>
      state.setIn(['fetchingStatus', 'guideStatus'], guideStatus),
    [setNextSlide]: state => {
      const currentSlide = state.getIn(['fetchingStatus', 'currentSlide'])
      return state.setIn(
        ['fetchingStatus', 'currentSlide'],
        currentSlide === 10 ? currentSlide : currentSlide + 1
      )
    },
    [setPrevSlide]: state => {
      const currentSlide = state.getIn(['fetchingStatus', 'currentSlide'])
      return state.setIn(
        ['fetchingStatus', 'currentSlide'],
        currentSlide === 0 ? currentSlide : currentSlide - 1
      )
    }
  },
  initialState
)

export default {
  actions,
  reducer,
  epics
}
