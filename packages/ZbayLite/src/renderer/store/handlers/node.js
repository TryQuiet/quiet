import Immutable from 'immutable'
import { handleActions } from 'redux-actions'
import { DateTime } from 'luxon'

export const NodeState = Immutable.Record({
  latestBlock: 0,
  currentBlock: 0,
  connections: 0,
  status: 'down',
  startedAt: null
}, 'NodeState')

export const initialState = NodeState({
  status: 'restarting',
  connections: 0,
  startedAt: DateTime.utc(2019, 3, 5, 9, 34, 48).toISO()
})

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
}, initialState)

export default {
  reducer,
  epics
}
