import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/dom'
import { act } from 'react-dom/test-utils'
import { take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../../../../../shared/setupTests'
import { prepareStore } from '../../../../testUtils/prepareStore'
import { renderComponent } from '../../../../testUtils/renderComponent'

import CreateChannel from '../../../../containers/widgets/channels/CreateChannel'
import CreateChannelComponent from '../../../../components/widgets/channels/CreateChannel/CreateChannel'

import { ModalName } from '../../../../sagas/modals/modals.types'
import { modalsActions } from '../../../../sagas/modals/modals.slice'

import { getFactory, identity, publicChannels } from '@quiet/nectar'

describe('Add new channel', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('Submits channel name without trailing hyphen', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
    )

    const factory = await getFactory(store)

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
      'Identity',
      { nickname: 'alice' }
    )

    renderComponent(<CreateChannel />, store)

    store.dispatch(modalsActions.openModal({ name: ModalName.createChannel }))

    const input = screen.getByPlaceholderText('Enter a channel name')
    const button = screen.getByText('Create Channel')

    userEvent.type(input, 'trailing-hyphen-')
    userEvent.click(button)

    await act(async () => {
      await runSaga(testSubmittedChannelName).toPromise()
    })

    function* testSubmittedChannelName(): Generator {
      const createChannelAction = yield* take(publicChannels.actions.createChannel)
      expect(createChannelAction.payload.channel.name).toEqual('trailing-hyphen')
    }
  })

  it('Submits channel name without trailing whitespace', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
    )

    const factory = await getFactory(store)

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
      'Identity',
      { nickname: 'alice' }
    )

    renderComponent(<CreateChannel />, store)

    store.dispatch(modalsActions.openModal({ name: ModalName.createChannel }))

    const input = screen.getByPlaceholderText('Enter a channel name')
    const button = screen.getByText('Create Channel')

    userEvent.type(input, 'trailing whitespace ')
    userEvent.click(button)

    await act(async () => {
      await runSaga(testSubmittedChannelName).toPromise()
    })

    function* testSubmittedChannelName(): Generator {
      const createChannelAction = yield* take(publicChannels.actions.createChannel)
      expect(createChannelAction.payload.channel.name).toEqual('trailing-whitespace')
    }
  })

  it('Parse channel name in real time', async () => {
    renderComponent(
      <CreateChannelComponent open={true} createChannel={() => {}} handleClose={() => {}} />
    )

    const input = screen.getByPlaceholderText('Enter a channel name')

    const assertions = [
      {
        insert: '    ',
        expect: ''
      },
      {
        insert: '----',
        expect: ''
      },
      {
        insert: '-start-with-hyphen',
        expect: 'start-with-hyphen'
      },
      {
        insert: ' start-with-space',
        expect: 'start-with-space'
      },
      {
        insert: 'end-with-hyphen-',
        expect: 'end-with-hyphen-'
      },
      {
        insert: 'end-with-double-hyphen--',
        expect: 'end-with-double-hyphen-'
      },
      {
        insert: 'end-with-space ',
        expect: 'end-with-space-'
      },
      {
        insert: 'end-with-hyphen-space  ',
        expect: 'end-with-hyphen-space-'
      },
      {
        insert: 'UpperCaseToLowerCase',
        expect: 'uppercasetolowercase'
      },
      {
        insert: 'spaces to hyphens',
        expect: 'spaces-to-hyphens'
      },
      {
        insert: 'regular-hyphens',
        expect: 'regular-hyphens'
      }
    ]

    for (const assertion of assertions) {
      userEvent.type(input, assertion.insert)
      expect(input).toHaveValue(assertion.expect)
      userEvent.clear(input)
    }
  })
})
