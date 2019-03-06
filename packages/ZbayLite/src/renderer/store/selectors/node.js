import { DateTime, Interval } from 'luxon'
import { createSelector } from 'reselect'

const store = s => s

const node = createSelector(store, state => state.get('node'))

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
    if (latest) {
      return Math.round((current / latest) * 100)
    }
    return null
  }
)

export default {
  currentBlock,
  latestBlock,
  status,
  uptime,
  connections,
  percentSynced
}
