import { combineReducers } from '@reduxjs/toolkit'
import { jest } from '@jest/globals'
import { expectSaga } from 'redux-saga-test-plan'

import { type LinkedDevice, SocketActions } from '@quiet/types'

import { applyEmitParams, type Socket } from '../../../types'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { connectionActions } from '../connection.slice'
import { connectionSelectors } from '../connection.selectors'
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

  it('replaces the previous list rather than appending to it', async () => {
    const store = prepareStore().store
    store.dispatch(
      connectionActions.setLinkedDevices([
        { deviceId: 'this-device', deviceName: 'this-device', isCurrent: true },
        { deviceId: 'old-laptop', deviceName: 'old-laptop', isCurrent: false },
      ])
    )
    expect(connectionSelectors.linkedDevices(store.getState())).toHaveLength(2)

    const devices: LinkedDevice[] = [{ deviceId: 'this-device', deviceName: 'this-device', isCurrent: true }]
    socket.registerExpectedResponse(SocketActions.GET_LINKED_DEVICES, devices)

    const { storeState } = await expectSaga(getLinkedDevicesSaga, socket as unknown as Socket)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .put(connectionActions.setLinkedDevices(devices))
      .run()

    expect(connectionSelectors.linkedDevices(storeState)).toEqual(devices)
  })
})
