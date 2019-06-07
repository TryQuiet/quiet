/* eslint import/first: 0 */
jest.mock('../../zcash')

import Immutable from 'immutable'
// import * as R from 'ramda'

import create from '../create'
import { actions, epics, initialState, operationTypes, PendingMessageOp } from './operations'
import selectors from '../selectors/operations'
import { createMessage } from '../../testUtils'
import { mock as zcashMock } from '../../zcash'

describe('Operations reducer handles ', () => {
  let store = null

  const addMessageOperation = () => {
    const message = Immutable.fromJS(
      createMessage('test-message-id-1')
    )

    store.dispatch(
      actions.addOperation({
        opId: `test-op-id-1`,
        type: operationTypes.pendingMessage,
        meta: PendingMessageOp({
          message,
          channelId: 'test-channel-id'
        })
      })
    )
  }

  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        operations: initialState
      })
    })
    jest.clearAllMocks()
  })

  describe('actions', () => {
    it('- addOperation', () => {
      addMessageOperation()

      expect(selectors.operations(store.getState())).toMatchSnapshot()
    })

    it('- removeOperation', () => {
      addMessageOperation()

      store.dispatch(actions.removeOperation('test-op-id-1'))

      expect(selectors.operations(store.getState())).toMatchSnapshot()
    })

    it('- removeOperations by txId', () => {
      addMessageOperation()

      store.dispatch(actions.resolveOperation({
        opId: 'test-op-id-1',
        status: 'success',
        txId: 'test-tx-id'
      }))

      store.dispatch(actions.removeOperation('test-tx-id'))

      expect().toMatchSnapshot()
    })

    describe('- resolveOperation', () => {
      it('- when success', () => {
        addMessageOperation(1)
        store.dispatch(actions.resolveOperation({
          opId: 'test-op-id-1',
          status: 'success',
          txId: 'test-tx-id'
        }))
        expect(selectors.operations(store.getState())).toMatchSnapshot()
      })

      it('- when error', () => {
        addMessageOperation(2)
        store.dispatch(actions.resolveOperation({
          opId: 'test-op-id-1',
          status: 'failed',
          error: {
            code: -4,
            message: 'Some error'
          }
        }))
        expect(selectors.operations(store.getState())).toMatchSnapshot()
      })
    })
  })

  describe('epics', () => {
    describe('- observeOperation', () => {
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
      const message = Immutable.fromJS(createMessage(`test-message-id-1`))
      const opId = 'test-op-id-1'
      const type = operationTypes.pendingMessage

      it('creates and resolves message on finish', async () => {
        await store.dispatch(
          epics.observeOperation({
            opId,
            type,
            meta: PendingMessageOp({
              message,
              channelId: 'test-channel-id'
            })
          })
        )

        expect(selectors.operations(store.getState())).toMatchSnapshot()
      })

      it('polls when no finished', async () => {
        zcashMock.requestManager.z_getoperationstatus.mockImplementation(async () => [{
          id: opId,
          status: 'executing'
        }])

        await store.dispatch(
          epics.observeOperation({
            opId,
            type,
            meta: PendingMessageOp({
              message,
              channelId: 'test-channel-id'
            })
          })
        )

        expect(setTimeout.mock.calls).toMatchSnapshot()
      })
    })
  })
})
