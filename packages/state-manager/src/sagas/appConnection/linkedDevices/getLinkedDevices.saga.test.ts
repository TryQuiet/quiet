import { combineReducers } from '@reduxjs/toolkit'
import { jest } from '@jest/globals'
import { expectSaga } from 'redux-saga-test-plan'

import { type LinkedDevice, SocketActions } from '@quiet/types'

import { applyEmitParams, type Socket } from '../../../types'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { connectionActions } from '../connection.slice'
import { getLinkedDevicesSaga } from './getLinkedDevices.saga'

describe('getLinkedDevices', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
  })

  it('stores the devices the backend reports', async () => {
    const devices: LinkedDevice[] = [
      { deviceId: 'this-device', deviceName: 'this-device', isCurrent: true },
      { deviceId: 'laptop', deviceName: 'laptop', created: 1_700_000_000_000, isCurrent: false },
    ]
    socket.registerExpectedResponse(SocketActions.GET_LINKED_DEVICES, devices)
    const store = prepareStore().store

    await expectSaga(getLinkedDevicesSaga, socket as unknown as Socket)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, applyEmitParams(SocketActions.GET_LINKED_DEVICES, {}))
      .put(connectionActions.setLinkedDevices(devices))
      .run()
  })

  it('stores an empty list when the backend has no answer', async () => {
    jest.spyOn(socket, 'emitWithAck').mockResolvedValueOnce(undefined)
    const store = prepareStore().store

    await expectSaga(getLinkedDevicesSaga, socket as unknown as Socket)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, applyEmitParams(SocketActions.GET_LINKED_DEVICES, {}))
      .put(connectionActions.setLinkedDevices([]))
      .run()
  })
})
