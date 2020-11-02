/* eslint import/first: 0 */
jest.mock('../../zcash')

import Immutable from 'immutable'
import * as R from 'ramda'

import handlers, { initialState, ReceivedUser } from './users'
import { NodeState } from './node'
import selectors from '../selectors/users'
import { ChannelsState } from './channels'
import { initialState as IdentityState } from './identity'
import create from '../create'
import testUtils from '../../testUtils'

describe('users reducer', () => {
  let store = null

  const userChannel = [testUtils.channels.createUsersChannel(1)]

  beforeEach(() => {
    store = create({
      initialState: {
        node: { ...NodeState, isTestnet: true },
        identity: {
          ...IdentityState,
          data: {
            name: 'Saturn',
            id: 'test-id',
            address:
              'ztestsapling1mwmpvwy2aah7dlt0c9l47gde982xv6snxq2srddfzx8efn2qht6mxnz65rtst0426gtxje0eqlm',
            signerPrivKey: '4e577989a286937f565cea6426bd75fc0c3b166d7bd28d8357ba633b3736a41d',
            signerPubKey: '033ec8436690fc8313202e16a531b2ec4799dd91a33025357a5386979f3cf081af',
            transparentAddress: 'transparent-test-address'
          }
        },
        users: initialState,
        channels: {
          ...ChannelsState,
          data: userChannel
        }
      }
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
    describe('isNicknameTaken', () => {
      beforeEach(() => {
        store = create({
          initialState: {
            node: { ...NodeState, isTestnet: true },
            users: {
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
            }
          }
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
          initialState: {
            node: { ...NodeState, isTestnet: true },
            users: initialState
          }
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
