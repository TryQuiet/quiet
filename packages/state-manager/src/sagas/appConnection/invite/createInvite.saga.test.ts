import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { connectionActions } from '../connection.slice'
import { setupCrypto } from '@quiet/identity'
import { reducers } from '../../reducers'
import { createInviteSaga } from './createInvite.saga'
import { SocketActions } from '@quiet/types'
import { applyEmitParams, Socket } from '../../../types'
import { longLivedInvite } from '../connection.selectors'
import { Base58 } from '3rd-party/auth/packages/crypto/dist'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { getSocketFactory } from '../../../utils/tests/factories'

describe('createInvite', () => {
  let socket: MockedSocket

  beforeEach(async () => {
    setupCrypto()
    socket = new MockedSocket()
  })

  it('create invite sets nothing when no sig chain is configured', async () => {
    // Register an empty response
    socket.registerExpectedResponse(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, {})

    const store = prepareStore().store

    const reducer = combineReducers(testReducers)
    await expectSaga(createInviteSaga, socket as unknown as Socket, connectionActions.createInvite({}))
      .withReducer(reducer)
      .withState(store.getState())
      .select(longLivedInvite)
      .apply(
        socket,
        socket.emitWithAck,
        applyEmitParams(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, { id: undefined })
      )
      .run()
  })

  it('create invite sets nothing when the long lived invite is already valid', async () => {
    // Register a response for a valid invite
    socket.registerExpectedResponse(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, {
      valid: true,
    })

    const store = prepareStore().store

    const existingInvite = {
      seed: '5ah8uYodiwuwVybT',
      id: '5ah8uYodiwuwVybT' as Base58,
    }
    store.dispatch(connectionActions.setLongLivedInvite(existingInvite))

    const reducer = combineReducers(testReducers)
    await expectSaga(createInviteSaga, socket as unknown as Socket, connectionActions.createInvite({}))
      .withReducer(reducer)
      .withState(store.getState())
      .select(longLivedInvite)
      .apply(
        socket,
        socket.emitWithAck,
        applyEmitParams(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, { id: existingInvite.id })
      )
      .run()
  })

  it('create invite updates long lived invite when the existing invite data is undefined', async () => {
    const newInvite = {
      seed: '5ah8uYodiwuwVybT',
      id: '5ah8uYodiwuwVybT' as Base58,
    }

    // Register a response for an invalid invite with a new invite
    socket.registerExpectedResponse(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, {
      valid: false,
      newInvite,
    })

    const store = prepareStore().store

    const reducer = combineReducers(testReducers)
    await expectSaga(createInviteSaga, socket as unknown as Socket, connectionActions.createInvite({}))
      .withReducer(reducer)
      .withState(store.getState())
      .select(longLivedInvite)
      .apply(
        socket,
        socket.emitWithAck,
        applyEmitParams(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, { id: undefined })
      )
      .putResolve(connectionActions.setLongLivedInvite(newInvite))
      .run()
  })

  it('create invite updates long lived invite when the existing invite data is defined but invalid', async () => {
    const newInvite = {
      seed: '5ah8uYodiwuwVybT',
      id: '5ah8uYodiwuwVybT' as Base58,
    }

    // Register a response for an invalid invite with a new invite
    socket.registerExpectedResponse(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, {
      valid: false,
      newInvite,
    })

    const store = prepareStore().store
    const existingInvite = {
      seed: '8ah8uYodiwuwVyb5',
      id: '8ah8uYodiwuwVyb5' as Base58,
    }
    store.dispatch(connectionActions.setLongLivedInvite(existingInvite))

    const reducer = combineReducers(testReducers)
    await expectSaga(createInviteSaga, socket as unknown as Socket, connectionActions.createInvite({}))
      .withReducer(reducer)
      .withState(store.getState())
      .select(longLivedInvite)
      .apply(socket, socket.emitWithAck, [
        SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE,
        { id: existingInvite.id },
      ])
      .putResolve(connectionActions.setLongLivedInvite(newInvite))
      .run()
  })
})
