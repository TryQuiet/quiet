/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'
import { DateTime } from 'luxon'

import create from '../create'
import { NodeState } from '../handlers/node'
import selectors from './node'

describe('node selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          currentBlock: 123,
          latestBlock: 1000,
          connections: 15,
          status: 'healthy',
          startedAt: DateTime.utc(2019, 3, 5, 9, 34, 48).toISO()
        })
      })
    })
    jest.clearAllMocks()
  })

  it('currentBlock', () => {
    expect(selectors.currentBlock(store.getState())).toEqual(123)
  })

  it('latestBlock', () => {
    expect(selectors.latestBlock(store.getState())).toEqual(1000)
  })

  it('connections', () => {
    expect(selectors.connections(store.getState())).toEqual(15)
  })

  it('status', () => {
    expect(selectors.status(store.getState())).toEqual('healthy')
  })

  it('node', () => {
    expect(selectors.node(store.getState())).toMatchSnapshot()
  })

  it('uptime', () => {
    const expected = {
      days: 2,
      hours: 3,
      minutes: 29,
      seconds: 0
    }
    const now = DateTime.utc(2019, 3, 7, 13, 3, 48)
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)

    expect(selectors.uptime(store.getState())).toEqual(expected)
  })
})
