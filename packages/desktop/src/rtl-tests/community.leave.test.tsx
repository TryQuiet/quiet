import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { LeaveCommunity } from '../renderer/components/Settings/Tabs/LeaveCommunity/LeaveCommunity'

jest.setTimeout(20_000)

describe('Leave community', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it("causes no error if there's no data yet", async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <LeaveCommunity />
      </>,
      store
    )
  })
})
