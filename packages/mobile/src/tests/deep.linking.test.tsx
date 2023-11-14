import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { act } from '@testing-library/react-native'
import { AnyAction } from 'redux'
import { take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../setupTests'
import { prepareStore } from './utils/prepareStore'
import { renderComponent } from './utils/renderComponent'
import { communities } from '@quiet/state-manager'
import { initActions } from '../store/init/init.slice'
import { ChannelListScreen } from '../screens/ChannelList/ChannelList.screen'

describe('Deep linking', () => {
  let socket: MockedSocket

  beforeEach(async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  test('does not override network data if triggered twice', async () => {
    const { store, runSaga, root } = await prepareStore({}, socket)

    // Log all the dispatched actions in order
    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action = yield* take()
        actions.push(action.type)
      }
    })

    renderComponent(
      <></>,
      store
    )

    const validCode =
      'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE=y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'

    store.dispatch(initActions.deepLink(validCode))
    await act(async () => {})

    const originalNetwork = communities.selectors.currentCommunity(store.getState())

    // Redo the action to provoke renewed saga runs
    store.dispatch(initActions.deepLink(validCode))
    await act(async () => {})

    const currentNetwork = communities.selectors.currentCommunity(store.getState())

    expect(originalNetwork?.id).toEqual(currentNetwork?.id)

    expect(actions).toMatchInlineSnapshot(`
      [
        "Init/deepLink",
        "Navigation/replaceScreen",
        "Communities/createNetwork",
        "Communities/setInvitationCodes",
        "Communities/addNewCommunity",
        "Communities/setCurrentCommunity",
        "Init/deepLink",
      ]
    `)

    // Stop state-manager sagas
    root?.cancel()
  })
})
