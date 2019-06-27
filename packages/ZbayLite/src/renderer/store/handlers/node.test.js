/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash', () => ({
  getClient: jest.fn(() => ({
    status: {},
    addresses: {},
    accounting: {}
  }))
}))

import BigNumber from 'bignumber.js'

import create from '../create'
import nodeHandlers from './node'
import nodeSelectors from '../selectors/node'
import { getClient } from '../../zcash'

describe('Node reducer handles', () => {
  const infoMock = jest.fn()
  const createMock = jest.fn()
  const balanceMock = jest.fn()

  let store = null
  beforeEach(() => {
    store = create()
    jest.clearAllMocks()
    getClient.mockImplementation(() => ({
      status: {
        info: infoMock
      },
      addresses: {
        create: createMock
      },
      accounting: {
        balance: balanceMock
      }
    }))
  })

  const assertStoreState = () => expect(
    nodeSelectors.node(store.getState())
  ).toMatchSnapshot()

  it('createAddress', async () => {
    createMock.mockImplementation(async (type) => `${type}-zcash-address`)
    const address = await store.dispatch(nodeHandlers.actions.createAddress('sapling'))
    expect(address).toMatchSnapshot()
  })

  it('rejected createAddress', async () => {
    createMock.mockImplementation(async () => {
      throw Error('createAddress error')
    })
    try {
      await store.dispatch(nodeHandlers.actions.createAddress('sapling'))
    } catch (err) {}
    assertStoreState()
  })

  describe('epics -', () => {
    describe('getStatus', () => {
      it('when successfull', async () => {
        infoMock.mockImplementation(async () => ({
          latestBlock: new BigNumber(2234),
          currentBlock: new BigNumber(12),
          connections: new BigNumber(10),
          isTestnet: true,
          status: 'healthy'
        }))
        await store.dispatch(nodeHandlers.epics.getStatus())
        assertStoreState()
      })

      it('when node is down', async () => {
        infoMock.mockImplementation(async () => {
          throw Error('some kind of node error')
        })
        try {
          await store.dispatch(nodeHandlers.epics.getStatus())
        } catch (err) {}
        assertStoreState()
      })
    })
  })
})
