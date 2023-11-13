import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { AnyAction } from 'redux'
import { take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { communities } from '@quiet/state-manager'

describe('Deep linking', () => {
  let socket: MockedSocket

  beforeEach(async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  test('does not override network data if triggered twice', async () => {
    const { store, runSaga } = await prepareStore({}, socket)

    // Log all the dispatched actions in order
    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action = yield* take()
        actions.push(action.type)
      }
    })

    renderComponent(<></>, store)

    const validPair = [
      {
        onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
        peerId: 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
      },
    ]

    store.dispatch(communities.actions.handleInvitationCodes(validPair))
    await act(async () => {})

    const originalNetwork = communities.selectors.currentCommunity(store.getState())

    // Redo the action to provoke renewed saga runs
    store.dispatch(communities.actions.handleInvitationCodes(validPair))
    await act(async () => {})

    const currentNetwork = communities.selectors.currentCommunity(store.getState())

    expect(originalNetwork?.id).toEqual(currentNetwork?.id)

    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Communities/handleInvitationCodes",
        "Communities/createNetwork",
        "Communities/setInvitationCodes",
        "Communities/addNewCommunity",
        "Communities/setCurrentCommunity",
        "Communities/handleInvitationCodes",
        "Modals/openModal",
      ]
    `)
  })
})
