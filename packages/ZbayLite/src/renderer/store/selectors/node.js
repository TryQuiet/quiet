import { DateTime, Interval } from 'luxon'
import { createSelector } from 'reselect'
import BigNumber from 'bignumber.js'

const store = s => s

export const node = createSelector(store, state => state.get('node'))

const currentBlock = createSelector(node, n => n.currentBlock)
const latestBlock = createSelector(node, n => n.latestBlock)
const connections = createSelector(node, n => n.connections)
const status = createSelector(node, n => n.status)
const uptime = createSelector(
  node,
  n => Interval
    .fromDateTimes(DateTime.fromISO(n.startedAt), DateTime.utc())
    .toDuration(['days', 'hours', 'minutes', 'seconds'])
    .normalize()
    .toObject()
)
const percentSynced = createSelector(
  [currentBlock, latestBlock],
  (current, latest) => {
    if (!latest.isZero()) {
      return current.dividedBy(latest).multipliedBy(100).toFixed(0, BigNumber.ROUND_DOWN)
    }
    return null
  }
)
const network = createSelector(node, n => {
  if (parseInt(process.env.ZBAY_IS_TESTNET) === 1) {
    return 'testnet'
  } else {
    return 'mainnet'
  }
})

const isConnected = createSelector(status, s => ['healthy', 'syncing'].includes(s))

const loader = createSelector(node, n => n.bootstrapLoader)
const fetching = createSelector(node, n => n.fetchingStatus)
const bootstrapping = createSelector(loader, n => n.loading)
const bootstrappingMessage = createSelector(loader, n => n.message)
const fetchingPart = createSelector(fetching, n => n.part)
const fetchingSize = createSelector(fetching, n => n.sizeLeft)
const fetchingStatus = createSelector(fetching, n => n.fetchingStatus)
const fetchingSpeed = createSelector(fetching, n => n.fetchingSpeed)
const fetchingEndTime = createSelector(fetching, n => n.fetchingEndTime)
const rescanningProgress = createSelector(fetching, n => n.rescanningProgress)
const isFetching = createSelector(fetching, n => n.isFetching)
const isRescanningMonitorStarted = createSelector(fetching, n => n.isRescanningMonitorStarted)
const isRescanningInitialized = createSelector(fetching, n => n.isRescanningInitialized)
const guideStatus = createSelector(fetching, n => n.guideStatus)

export default {
  node,
  currentBlock,
  latestBlock,
  status,
  uptime,
  connections,
  network,
  percentSynced,
  isConnected,
  bootstrapping,
  bootstrappingMessage,
  fetchingPart,
  fetchingSize,
  fetchingStatus,
  fetchingSpeed,
  isFetching,
  fetchingEndTime,
  rescanningProgress,
  isRescanningMonitorStarted,
  isRescanningInitialized,
  guideStatus
}
