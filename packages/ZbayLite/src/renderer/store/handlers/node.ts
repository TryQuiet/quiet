// import Immutable from 'immutable'
import { produce, immerable } from 'immer'
import BigNumber from 'bignumber.js'
import { ipcRenderer } from 'electron'
import { createAction, handleActions } from 'redux-actions'

import { typeRejected, FetchingState } from './utils'
import client from '../../zcash'
import { actionTypes } from '../../../shared/static'
import nodeSelectors from '../selectors/node'

import { ActionsType, PayloadType } from './types'

const DEFAULT_ADDRESS_TYPE = 'sapling'

export class Node {
  latestBlock: BigNumber = new BigNumber(999999)
  currentBlock: BigNumber = new BigNumber(0)
  connections: BigNumber = new BigNumber(0)
  isTestnet?: boolean
  status: string = 'healthy'
  errors: string = ''
  loading: boolean = false
  bootstrappingMessage: string = ''
  fetchingStatus: FetchingState = {
    ...new FetchingState()
  }

  startedAt?: string
  isRescanning: boolean = false

  constructor(values?: Partial<Node>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: Node = new Node({})

export const NodeState = initialState

const setStatus = createAction<{
  status?: string
  errors?: string
  latestBlock?: BigNumber
  currentBlock?: BigNumber
}>(actionTypes.SET_STATUS)
const createAddress = createAction(
  actionTypes.CREATE_ADDRESS,
  async (type = DEFAULT_ADDRESS_TYPE) => {
    return client.addresses.create(type)
  }
)
const setBootstrapping = createAction<boolean>(actionTypes.SET_BOOTSTRAPPING)
const setBootstrappingMessage = createAction<string>(actionTypes.SET_BOOTSTRAPPING_MESSAGE)
const setFetchingPart = createAction(actionTypes.SET_FETCHING_PART)
const setIsRescanning = createAction<boolean>(actionTypes.SET_IS_RESCANNING)
const setFetchingSizeLeft = createAction(actionTypes.SET_FETCHING_SIZE_LEFT)
const setFetchingStatus = createAction(actionTypes.SET_FETCHING_STATUS)
const setFetchingSpeed = createAction(actionTypes.SET_FETCHING_SPEED)
const setFetchingEndTime = createAction(actionTypes.SET_FETCHING_END_TIME)
const setConnectionStatus = createAction(actionTypes.SET_CONNECTION_STATUS)
const setRescanningProgress = createAction(actionTypes.SET_RESCANNING_PROGRESS)
const setRescanningMonitorStatus = createAction(actionTypes.SET_RESCANNING_MONITOR_STATUS)
const setRescanningStatus = createAction(actionTypes.SET_RESCANNING_STATUS)
const setGuideStatus = createAction<boolean>(actionTypes.SET_GUIDE_STATUS)
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

export type NodeActions = ActionsType<typeof actions>

export const startRescanningMonitor = () => async dispatch => {
  ipcRenderer.send('toggle-rescanning-progress-monitor')
  dispatch(setRescanningMonitorStatus(true))
}

export const setRescanningInitialized = () => async dispatch => {
  dispatch(setRescanningStatus(true))
}

export const disablePowerSaveMode = () => async () => {
  ipcRenderer.send('disable-sleep-prevention')
}

export const checkNodeStatus = nodeProcessStatus => async (_dispatch, getState) => {
  const nodeResponseStatus = nodeSelectors.status(getState())
  if (nodeProcessStatus === 'up' && nodeResponseStatus === 'down') {
    ipcRenderer.send('restart-node-proc')
  }
}
let lastSavedBlock = 0
const getStatus = () => async (dispatch, getState) => {
  try {
    console.log('info')
    const info = await client.info()
    console.log('info 2')
    const height = await client.height()
    if (info.latest_block_height > height) {
      client.sync()
    } else {
      dispatch(setStatus({ status: 'healthy' }))
    }
    // Check if sync give time cli to start rescan

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      const syncStatus = await client.syncStatus()
      if (syncStatus.syncing === 'false' && lastSavedBlock + 25 < height) {
        client.save()
        lastSavedBlock = height
        if (nodeSelectors.isRescanning(getState())) {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          setTimeout(async () => {
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

const epics = {
  getStatus,
  startRescanningMonitor,
  disablePowerSaveMode,
  setRescanningInitialized,
  checkNodeStatus
}

export const reducer = handleActions<Node, PayloadType<NodeActions>>(
  {
    [setStatus.toString()]: (state, { payload: status }: NodeActions['setStatus']) =>
      produce(state, () => {
        return Object.assign({}, state, status)
      }),
    [typeRejected(actionTypes.CREATE_ADDRESS)]: (state, { payload: errors }) =>
      produce(state, draft => {
        draft.errors = errors
      }),
    [setBootstrapping.toString()]: (
      state,
      { payload: bootstrapping }: NodeActions['setBootstrapping']
    ) =>
      produce(state, draft => {
        draft.loading = bootstrapping
      }),
    [setIsRescanning.toString()]: (
      state,
      { payload: isRescanning }: NodeActions['setIsRescanning']
    ) =>
      produce(state, draft => {
        draft.isRescanning = isRescanning
      }),
    [setBootstrappingMessage.toString()]: (
      state,
      { payload: message }: NodeActions['setBootstrappingMessage']
    ) =>
      produce(state, draft => {
        draft.bootstrappingMessage = message
      }),
    [setGuideStatus.toString()]: (state, { payload: guideStatus }: NodeActions['setGuideStatus']) =>
      produce(state, draft => {
        draft.fetchingStatus.guideStatus = guideStatus
      }),
    [setNextSlide.toString()]: state =>
      produce(state, draft => {
        const currentSlide = draft.fetchingStatus.currentSlide
        const slideToSet = currentSlide === 10 ? currentSlide : currentSlide + 1
        draft.fetchingStatus.currentSlide = slideToSet
      }),
    [setPrevSlide.toString()]: state =>
      produce(state, draft => {
        const currentSlide = draft.fetchingStatus.currentSlide
        const slideToSet = currentSlide === 0 ? currentSlide : currentSlide - 1
        draft.fetchingStatus.currentSlide = slideToSet
      })
  },
  initialState
)

export default {
  actions,
  reducer,
  epics
}
