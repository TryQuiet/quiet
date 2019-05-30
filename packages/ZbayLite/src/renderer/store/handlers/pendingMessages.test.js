/* eslint import/first: 0 */
jest.mock('../../zcash')

import Immutable from 'immutable'
import * as R from 'ramda'

import create from '../create'
import { actions, epics, initialState } from './pendingMessages'
import selectors from '../selectors/pendingMessages'
import { createMessage } from '../../testUtils'
import { mock as zcashMock } from '../../zcash'

describe('Pending messages reducer handles ', () => {
  let store = null

  const addMessages = n => R.range(0, 2).map(i => {
    const message = createMessage(`test-message-id-${i}`)
    store.dispatch(
      actions.addMessage({
        message,
        opId: `test-op-id-${i}`,
        channelId: 'test-channel-id'
      })
    )
  })

  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        pendingMessages: initialState
      })
    })
    jest.clearAllMocks()
  })

  describe('actions', () => {
    it('- addMessage', () => {
      addMessages(2)
      expect(selectors.pendingMessages(store.getState())).toMatchSnapshot()
    })

    it('- removeMessage', () => {
      addMessages(2)
      store.dispatch(actions.removeMessage('test-op-id-1'))
      expect(selectors.pendingMessages(store.getState())).toMatchSnapshot()
    })

    it('- removeMessage by txId', () => {
      addMessages(1)
      store.dispatch(actions.resolveMessage({
        opId: 'test-op-id-1',
        status: 'success',
        txId: 'test-tx-id'
      }))

      store.dispatch(actions.removeMessage('test-tx-id'))

      expect(selectors.pendingMessages(store.getState())).toMatchSnapshot()
    })

    describe('- resolveMessage', () => {
      it('- when success', () => {
        addMessages(2)
        store.dispatch(actions.resolveMessage({
          opId: 'test-op-id-1',
          status: 'success',
          txId: 'test-tx-id'
        }))
        expect(selectors.pendingMessages(store.getState())).toMatchSnapshot()
      })

      it('- when error', () => {
        addMessages(2)
        store.dispatch(actions.resolveMessage({
          opId: 'test-op-id-1',
          status: 'failed',
          error: {
            code: -4,
            message: 'Some error'
          }
        }))
        expect(selectors.pendingMessages(store.getState())).toMatchSnapshot()
      })
    })

    describe('epics', () => {
      describe('- observeMessage', () => {
        beforeEach(() => {
          jest.useFakeTimers()
          zcashMock.requestManager.z_getoperationstatus.mockImplementation(async () => [{
            id: opId,
            status: 'success',
            result: {
              txid: 'test-tx-id'
            },
            error: { code: -1, message: 'no error' }
          }])
        })
        const message = createMessage(`test-message-id-1`)
        const opId = 'test-op-id-1'
        const channelId = 'test-channel-id'

        it('creates and resolves message on finish', async () => {
          await store.dispatch(epics.observeMessage({ opId, message, channelId }))

          expect(selectors.pendingMessages(store.getState())).toMatchSnapshot()
        })

        it('polls when no finished', async () => {
          zcashMock.requestManager.z_getoperationstatus.mockImplementation(async () => [{
            id: opId,
            status: 'executing'
          }])

          await store.dispatch(epics.observeMessage({ opId, message, channelId }))

          expect(setTimeout.mock.calls).toMatchSnapshot()
        })
      })
    })
  })
})
