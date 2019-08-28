/* eslint import/first: 0 */
jest.mock('../../zcash')
jest.mock('../../vault')

import Immutable from 'immutable'
import * as R from 'ramda'

import handlers, { initialState, ReceivedUser } from './users'
import { NodeState } from './node'
import selectors from '../selectors/users'
import { packMemo } from '../../zbay/transit'
import { mock as zcashMock } from '../../zcash'
import { ChannelsState } from './channels'

import create from '../create'
import testUtils from '../../testUtils'

describe('users reducer', () => {
  let store = null

  const userChannel = Immutable.fromJS([testUtils.channels.createUsersChannel(1)])

  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        node: NodeState({ isTestnet: true }),
        users: initialState,
        channels: ChannelsState({
          data: userChannel
        })
      })
    })
    jest.clearAllMocks()
  })

  describe('handles actions -', () => {
    describe('setUsers', () => {
      it('sets users when empty', () => {
        const users = R.range(0, 3)
          .map(id => testUtils.messages.createReceivedUserMessage({ id: `test-user-${id}` }))
          .reduce(
            async (acc = Promise.resolve(Immutable.Map({})), message) => {
              const accumulator = await acc
              return Promise.resolve(
                accumulator.merge(ReceivedUser(message, 0)).merge(ReceivedUser(message, 1))
              )
            },
            Promise.resolve(Immutable.Map({}))
          )
        const users2 = R.range(3, 5)
          .map(id => testUtils.messages.createReceivedUserMessage({ id: `test-user-${id}` }))
          .reduce(
            async (acc = Promise.resolve(Immutable.Map({})), message) => {
              const accumulator = await acc
              return Promise.resolve(
                accumulator.merge(ReceivedUser(message, 0)).merge(ReceivedUser(message, 1))
              )
            },
            Promise.resolve(Immutable.Map({}))
          )

        store.dispatch(handlers.actions.setUsers({ users }))
        store.dispatch(handlers.actions.setUsers({ messages: users2 }))

        expect(selectors.users(store.getState())).toMatchSnapshot()
      })
    })
  })

  describe('handles epics -', () => {
    describe('fetch users', () => {
      const _createMessagesForUsers = num => async address =>
        Promise.all(
          R.range(0, num).map(async i => {
            const message = testUtils.messages.createSendableUserMessage({
              message: {
                firstName: 'testname',
                lastName: 'testlastname',
                nickname: 'nickname',
                address:
                  'ztestsapling14dxhlp8ps4qmrslt7pcayv8yuyx78xpkrtfhdhae52rmucgqws2zp0zwf2zu6qxjp96lzapsn4r'
              },
              createdAt: testUtils.now.minus({ hours: i }).toSeconds()
            })
            return testUtils.transfers.createTransfer({
              txid: `tx-id-${i}-${address}`,
              memo: await packMemo(message)
            })
          })
        )

      it('when users', async () => {
        await zcashMock.requestManager.z_listreceivedbyaddress.mockImplementation(
          _createMessagesForUsers(2)
        )
        await store.dispatch(handlers.epics.fetchUsers())
        expect(selectors.users(store.getState())).toMatchSnapshot()
      })
    })

    describe('isNicknameTaken', () => {
      beforeEach(() => {
        store = create({
          initialState: Immutable.Map({
            node: NodeState({ isTestnet: true }),
            users: Immutable.fromJS({
              '02c9b30ea203dcd5776d014e0062a3232c00b74273094ebb1f119fb5cee88c2392': {
                firstName: 'testname',
                lastName: 'testlastname',
                nickname: 'test-user-1',
                address: 'ztestsapling1k059n2xjz5apmu49ud6xa0g4lywetd0zgpz2txe9xs5pu27fjjnp7c9yvtkcqlwz0n7qxrhyb4c'
              },
              '02c9b30ea203dcd5776d014e0062a3232c00b74273094ebb1f119fb5cee88c23vb': {
                firstName: 'testname',
                lastName: 'testlastname',
                nickname: 'test-user-1',
                address: 'ztestsapling1k059n2xjz5apmu49ud6xa0g4lywetd0zgpz2txe9xs5pu27fjjnp7c9yvtkcqlwz0n7qxrhyb4c'
              },
              '04c9b30ea203dcd5776d014e0062a3232c00b74273094ebb1f119fb5cee88c2355': {
                firstName: 'testname',
                lastName: 'testlastname',
                nickname: 'test-user-2',
                address: 'ztestsapling1k059n2xjz5apmu49ud6xa0g4lywetd0zgpz2txe9xs5pu27fjjnp7c9yvtkcqlwz0n7qxrhylnn'
              },
              '04c9b30ea203dcd5776d014e0062a3232c00b74273094ebb1f119fb5cee88c2vbf': {
                firstName: 'testname',
                lastName: 'testlastname',
                nickname: 'test-user-2',
                address: 'ztestsapling1k059n2xjz5apmu49ud6xa0g4lywetd0zgpz2txe9xs5pu27fjjnp7c9yvtkcqlwz0n7qxrhylnn'
              }
            })
          })
        })
        jest.clearAllMocks()
      })

      it('should return true for taken username', async () => {
        const isNicknameTaken = await store.dispatch(handlers.epics.isNicknameTaken('test-user-2'))
        expect(isNicknameTaken).toBeTruthy()
      })

      it('should return false for available username', async () => {
        const isNicknameTaken = await store.dispatch(handlers.epics.isNicknameTaken('test-new-user'))
        expect(isNicknameTaken).toBeFalsy()
      })
    })

    describe('isNicknameTaken on empty store', () => {
      beforeEach(() => {
        store = create({
          initialState: Immutable.Map({
            node: NodeState({ isTestnet: true }),
            users: initialState
          })
        })
        jest.clearAllMocks()
      })

      it('should return false for available username when no users', async () => {
        const isNicknameTaken = await store.dispatch(handlers.epics.isNicknameTaken('test-user-2'))
        expect(isNicknameTaken).toBeFalsy()
      })
    })
  })
})
