import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { act } from '@testing-library/react-native'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../setupTests'
import { prepareStore } from './utils/prepareStore'
import { renderComponent } from './utils/renderComponent'
import { SplashScreen } from '../screens/Splash/Splash.screen'
import { ScreenNames } from '../const/ScreenNames.enum'
import { initActions } from '../store/init/init.slice'
import { take } from 'typed-redux-saga'
import { navigationActions } from '../store/navigation/navigation.slice'

describe('Splash screen', () => {
  let socket: MockedSocket

  beforeEach(async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  test('waits for redux store to become ready, before storing invitation code', async () => {
    const { store, root, runSaga } = await prepareStore({}, socket)

    const invitationCode =
      'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE=y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'

    const route: { key: string; name: ScreenNames.SplashScreen; path: string } = {
      key: '',
      name: ScreenNames.SplashScreen,
      path: invitationCode,
    }

    renderComponent(
      <>
        <SplashScreen route={route} />
      </>,
      store
    )

    await act(async () => {
      store.dispatch(initActions.setStoreReady())
    })

    const deepLink = store.getState().Init.deepLinking
    expect(deepLink).toBe(true)

    await act(async () => {
      store.dispatch(initActions.setWebsocketConnected({ dataPort: 9700 }))
    })

    await act(async () => {
      await runSaga(function* (): Generator {
        const action = yield* take(navigationActions.replaceScreen)
        expect(action.payload).toEqual({
          screen: ScreenNames.JoinCommunityScreen,
          params: {
            code: invitationCode,
          },
        })
      }).toPromise()
    })

    // Stop state-manager sagas
    root?.cancel()
  })
})
