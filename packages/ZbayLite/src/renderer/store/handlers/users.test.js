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
import vault from '../../vault'
import { ChannelsState } from './channels'
import { IdentityState, Identity } from './identity'
import create from '../create'
import testUtils from '../../testUtils'

describe('users reducer', () => {
  let store = null

  const userChannel = Immutable.fromJS([testUtils.channels.createUsersChannel(1)])

  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        node: NodeState({ isTestnet: true }),
        identity: IdentityState({
          data: Identity({
            name: 'Saturn',
            id: 'test-id',
            address:
              'ztestsapling1mwmpvwy2aah7dlt0c9l47gde982xv6snxq2srddfzx8efn2qht6mxnz65rtst0426gtxje0eqlm',
            signerPrivKey: '4e577989a286937f565cea6426bd75fc0c3b166d7bd28d8357ba633b3736a41d',
            signerPubKey: '033ec8436690fc8313202e16a531b2ec4799dd91a33025357a5386979f3cf081af',
            transparentAddress: 'transparent-test-address'
          })
        }),
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
      it('sets users when empty', async () => {
        const users = await R.range(0, 3)
          .map(id => testUtils.messages.createReceivedUserMessage({ id: `test-user-${id}` }))
          .reduce(async (acc = Promise.resolve(Immutable.Map({})), message) => {
            const accumulator = await acc
            const user = ReceivedUser(message, accumulator)

            return Promise.resolve(accumulator.merge(user))
          }, Promise.resolve(Immutable.Map({})))
        const users2 = await R.range(3, 5)
          .map(id => testUtils.messages.createReceivedUserMessage({ id: `test-user-${id}` }))
          .reduce(async (acc = Promise.resolve(Immutable.Map({})), message) => {
            const accumulator = await acc
            const user = ReceivedUser(message, accumulator)

            return Promise.resolve(accumulator.merge(user))
          }, Promise.resolve(Immutable.Map({})))

        store.dispatch(handlers.actions.setUsers({ users }))
        store.dispatch(handlers.actions.setUsers({ messages: users2 }))

        expect(selectors.users(store.getState())).toMatchSnapshot()
      })
      it('sets users with same usernames', async () => {
        const users = await R.range(0, 3)
          .map(id => testUtils.messages.createReceivedUserMessage({ id: `test-user-${id}` }))
          .reduce(async (acc = Promise.resolve(Immutable.Map({})), message) => {
            const accumulator = await acc
            const user = ReceivedUser(message, accumulator)

            return Promise.resolve(accumulator.merge(user))
          }, Promise.resolve(Immutable.Map({})))
        store.dispatch(handlers.actions.setUsers({ users }))
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
              memo: await packMemo(message),
              timereceived: i * 2
            })
          })
        )
      const _createTransfersInfo = num => async tx => ({
        txid: `${tx}2`,
        memo: 'memo',
        timereceived: 123
      })

      it('when users', async () => {
        await zcashMock.requestManager.z_listreceivedbyaddress.mockImplementation(
          _createMessagesForUsers(2)
        )
        await zcashMock.requestManager.gettransaction.mockImplementation(_createTransfersInfo(2))
        vault.getVault.mockImplementation(() => ({
          transactionsTimestamps: {
            addTransaction: jest.fn(async () => {})
          }
        }))
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
                address:
                  'ztestsapling1k059n2xjz5apmu49ud6xa0g4lywetd0zgpz2txe9xs5pu27fjjnp7c9yvtkcqlwz0n7qxrhyb4c'
              },
              '02c9b30ea203dcd5776d014e0062a3232c00b74273094ebb1f119fb5cee88c23vb': {
                firstName: 'testname',
                lastName: 'testlastname',
                nickname: 'test-user-1',
                address:
                  'ztestsapling1k059n2xjz5apmu49ud6xa0g4lywetd0zgpz2txe9xs5pu27fjjnp7c9yvtkcqlwz0n7qxrhyb4c'
              },
              '04c9b30ea203dcd5776d014e0062a3232c00b74273094ebb1f119fb5cee88c2355': {
                firstName: 'testname',
                lastName: 'testlastname',
                nickname: 'test-user-2',
                address:
                  'ztestsapling1k059n2xjz5apmu49ud6xa0g4lywetd0zgpz2txe9xs5pu27fjjnp7c9yvtkcqlwz0n7qxrhylnn'
              },
              '04c9b30ea203dcd5776d014e0062a3232c00b74273094ebb1f119fb5cee88c2vbf': {
                firstName: 'testname',
                lastName: 'testlastname',
                nickname: 'test-user-2',
                address:
                  'ztestsapling1k059n2xjz5apmu49ud6xa0g4lywetd0zgpz2txe9xs5pu27fjjnp7c9yvtkcqlwz0n7qxrhylnn'
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
        const isNicknameTaken = await store.dispatch(
          handlers.epics.isNicknameTaken('test-new-user')
        )
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

    describe('createOrUpdateUser', () => {
      beforeEach(() => {
        Date.now = jest.fn(() => testUtils.now)
      })

      it('sends registration message', async () => {
        const message = {
          firstName: 'testname',
          lastName: 'testlastname',
          nickname: 'nickname',
          address:
            'ztestsapling14dxhlp8ps4qmrslt7pcayv8yuyx78xpkrtfhdhae52rmucgqws2zp0zwf2zu6qxjp96lzapsn4r'
        }

        await store.dispatch(handlers.epics.createOrUpdateUser(message))

        const result = zcashMock.requestManager.z_sendmany.mock.calls
        expect(result.length).toBe(1)
        expect(result).toMatchSnapshot()
      })
    })
  })
})
