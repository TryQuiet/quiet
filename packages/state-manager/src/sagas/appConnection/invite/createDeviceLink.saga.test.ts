import { combineReducers } from '@reduxjs/toolkit'
import { jest } from '@jest/globals'
import { expectSaga } from 'redux-saga-test-plan'

import { type DeviceLinkInvite, SocketActions } from '@quiet/types'

import { applyEmitParams, type Socket } from '../../../types'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { connectionActions } from '../connection.slice'
import { createDeviceLinkSaga } from './createDeviceLink.saga'

describe('createDeviceLink', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
  })

  it('stores a newly generated device invitation', async () => {
    const invite: DeviceLinkInvite = {
      id: '5ah8uYodiwuwVybT' as DeviceLinkInvite['id'],
      seed: '5ah8uYodiwuwVybT',
      expiresAt: 1_700_001_800_000,
      userId: '7JLX5PGtsFtGtqfY2co5U8Lq5hTA3',
      userName: 'Alice device owner',
    }
    socket.registerExpectedResponse(SocketActions.CREATE_DEVICE_LINK, invite)
    const store = prepareStore().store

    await expectSaga(createDeviceLinkSaga, socket as unknown as Socket)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, applyEmitParams(SocketActions.CREATE_DEVICE_LINK, {}))
      .putResolve(connectionActions.setDeviceLinkInvite(invite))
      .run()
  })

  it('clears stale invitation state when generation fails', async () => {
    jest.spyOn(socket, 'emitWithAck').mockResolvedValueOnce(undefined)
    const store = prepareStore().store

    await expectSaga(createDeviceLinkSaga, socket as unknown as Socket)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, applyEmitParams(SocketActions.CREATE_DEVICE_LINK, {}))
      .putResolve(connectionActions.setDeviceLinkInvite(undefined))
      .run()
  })
})
