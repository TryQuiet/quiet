import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import { Task } from 'redux-saga'
import MockedSocket from 'socket.io-mock'
import { FactoryGirl } from 'factory-girl'
import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { getFactory, identity, communities, Store, users } from '@quiet/state-manager'
import { type Community } from '@quiet/types'
import UsernameTakenModalContainer from '../renderer/components/widgets/usernameTakenModal/UsernameTakenModal.container'
import userEvent from '@testing-library/user-event'

jest.setTimeout(20_000)

describe('Username taken', () => {
  let socket: MockedSocket

  let redux: {
    store: Store
    runSaga: (saga: any) => Task
  }

  let factory: FactoryGirl

  let community: Community

  beforeEach(async () => {
    socket = new MockedSocket()

    ioMock.mockImplementation(() => socket)

    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))

    redux = await prepareStore({}, socket)
    factory = await getFactory(redux.store)

    community = await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>('Community')
  })

  it('Displays username taken modal', async () => {
    const alice = (
      await factory.build<typeof identity.actions.addNewIdentity>('Identity', {
        id: community.id,
        nickname: 'alice',
      })
    ).payload

    // @ts-expect-error
    redux.store.dispatch(users.actions.storeUserCertificate({ certificate: alice.userCertificate }))

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
      userCertificate: null,
    })

    renderComponent(
      <>
        <UsernameTakenModalContainer />
      </>,
      redux.store
    )

    const modal = screen.getByTestId('duplicated-username-prompt')
    expect(modal).toBeVisible()

    const input = screen.getByPlaceholderText('Username')
    await userEvent.type(input, alice.nickname)

    const button = screen.getByText('Continue')
    await userEvent.click(button)

    const error = screen.getByText('You cannot register with this username.')
    expect(error).toBeVisible()
  })
})
