/* eslint import/first: 0 */
jest.mock('../../zcash')
jest.mock('../../vault')

import Immutable from 'immutable'
// import * as R from 'ramda'

import create from '../create'
import { actions, initialState, checkConfirmationNumber } from './directMessagesQueue'
import operationsSelectors from '../selectors/operations'
import selectors from '../selectors/directMessagesQueue'
import { IdentityState, Identity } from './identity'
import { now, createSendableTransferMessage } from '../../testUtils'
import { mock as zcashMock } from '../../zcash'
import { epics, operationTypes, PendingDirectMessageOp } from './operations'
import { mock as vaultMock, getVault } from '../../vault'
import { createArchive } from '../../vault/marshalling'

describe('Messages queue reducer handles', () => {
  let store = null

  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        directMessagesQueue: initialState,
        identity: IdentityState({
          data: Identity({
            id: 'test-identityId',
            address: 'test-address',
            name: 'Saturn',
            balance: '33.583004'
          })
        })
      })
    })
  })

  describe('actions', () => {
    describe('- addMessage', () => {
      it('when empty', () => {
        const message = createSendableTransferMessage({ message: 'test-message-id' })
        store.dispatch(actions.addDirectMessage({ message, recipientAddress: 'test-recipient-address', recipientUsername: 'test-recipient-username' }))
        expect(selectors.queue(store.getState())).toMatchSnapshot()
      })

      it('when has matching message', () => {
        const message = createSendableTransferMessage({ message: 'test-message-id', createdAt: now.toSeconds() })
        const message2 = createSendableTransferMessage({ message: 'test-message-id-2', createdAt: now.plus({ seconds: 1 }).toSeconds() })
        store.dispatch(actions.addDirectMessage({ message, recipientAddress: 'test-recipient-address', recipientUsername: 'test-recipient-username' }))
        store.dispatch(actions.addDirectMessage({ message: message2, recipientAddress: 'test-recipient-address', recipientUsername: 'test-recipient-username' }))
        expect(selectors.queue(store.getState())).toMatchSnapshot()
      })

      it('- removeMessage', () => {
        const message = createSendableTransferMessage({ message: 'test-message-id' })
        const { payload: { key } } = store.dispatch(actions.addDirectMessage({ message, recipientAddress: 'test-recipient-address', recipientUsername: 'test-recipient-username' }))

        store.dispatch(actions.removeMessage(key))

        expect(selectors.queue(store.getState())).toMatchSnapshot()
      })
    })
  })

  describe('epics', () => {
    const transactionStatus = {
      amount: 0,
      confirmations: 0,
      time: 1558434676,
      timereceived: 1558434904,
      hex: 'test-hex',
      txid: 'test-tx-id',
      details: []
    }
    describe('- checkConfirmationStatus', () => {
      beforeEach(() => {
        jest.clearAllTimers()
        jest.useFakeTimers()
        zcashMock.requestManager.gettransaction.mockImplementation(jest.fn(() => Promise.resolve(transactionStatus)))
      })
      const message = Immutable.fromJS(createSendableTransferMessage({ message: 'test-message-id', createdAt: now.toSeconds() }))
      const opId = 'test-op-id-1'
      const type = operationTypes.pendingDirectMessage
      vaultMock.workspace.archive = createArchive()
      vaultMock.workspace.save = jest.fn()

      it('polls when no finished, vault should have stored message with status success', async () => {
        await store.dispatch(
          epics.observeOperation({
            opId,
            type,
            meta: PendingDirectMessageOp({
              message,
              recipientAddress: 'test-recipient-address',
              recipientUsername: 'test-recipient-username'
            })
          }))
        await checkConfirmationNumber({ opId, status: 'success', txId: 'test-tx-id', error: null, dispatch: store.dispatch, getState: store.getState })
        jest.advanceTimersByTime(120000)
        const storedMessage = await getVault().contacts.listMessages({ identityId: 'test-identityId', recipientAddress: 'test-recipient-address', recipientUsername: 'test-recipient-username' })
        expect(setTimeout.mock.calls.filter(call => call[1] === 60000)).toMatchSnapshot()
        expect(storedMessage).toMatchSnapshot()
      })

      it('change confirmation status of messages in vault, store should not have any pending direct messages', async () => {
        const transactionStatusConfirmed = {
          amount: 0,
          confirmations: 3,
          time: 1558434676,
          timereceived: 1558434904,
          hex: 'test-hex',
          txid: 'test-tx-id',
          details: []
        }
        zcashMock.requestManager.gettransaction.mockImplementation(async () => transactionStatusConfirmed)
        await store.dispatch(
          epics.observeOperation({
            opId,
            type,
            meta: PendingDirectMessageOp({
              message,
              recipientAddress: 'test-recipient-address',
              recipientUsername: 'test-recipient-username'
            })
          })
        )

        await checkConfirmationNumber({ opId, status: 'success', txId: 'test-tx-id', error: null, dispatch: store.dispatch, getState: store.getState })
        const storedMessage = await getVault().contacts.listMessages({ identityId: 'test-identityId', recipientAddress: 'test-recipient-address', recipientUsername: 'test-recipient-username' })
        const pendingDirectMessages = operationsSelectors.pendingDirectMessages(store.getState()).toJS()
        expect(pendingDirectMessages).toMatchSnapshot()
        expect(storedMessage).toMatchSnapshot()
      })
    })
  })
})
