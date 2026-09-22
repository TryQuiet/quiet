import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { prepareStore, testReducers } from '../renderer/testUtils/prepareStore'
import { renderComponent } from '../renderer/testUtils'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { communities, identity } from '@quiet/state-manager'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import JoinCommunity from '../renderer/components/CreateJoinCommunity/JoinCommunity/JoinCommunity'
import GetStarted from '../renderer/components/Onboarding/GetStarted'
import CreateUsername from '../renderer/components/CreateUsername/CreateUsername'
import {
  CommunityOwnership,
  InvitationDataVersion,
  type Community,
  type InvitationData,
  type Identity,
  type InvitationDataV4,
} from '@quiet/types'
import { composeInvitationDeepUrl } from '@quiet/common'
import { act } from '@testing-library/react'
import { createLogger } from './logger'

const logger = createLogger('customProtocol.test')

jest.setTimeout(20_000)

describe('Opening app through custom protocol', () => {
  let socket: MockedSocket

  const invitationCodes: InvitationDataV4 = {
    version: InvitationDataVersion.v4,
    pairs: [
      {
        peerId: 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
        onionAddress: 'bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd',
      },
    ],
    psk: 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw=',
    authData: {
      teamId: 'F8UrkARjjngkBJVSJp1dTVo63xMZRcFzsH5wXGwgprW2',
      communityName: 'communityName',
      seed: '6k6damwb3z1emfqw',
    },
  }

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)

    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  it('goes directly to the username registration step', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const deepUrl = composeInvitationDeepUrl(invitationCodes)
    logger.info(`Deep link URL: ${deepUrl}`)
    store.dispatch(communities.actions.customProtocol([deepUrl]))

    store.dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))

    await act(async () => {
      renderComponent(
        <>
          <JoinCommunity />
          <CreateUsername />
        </>,
        store
      )
    })

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Choose username')
    expect(createUsernameTitle).toBeVisible()
  })

  it('takes an invite link opened on the Join with invite link screen straight to username registration', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    store.dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))

    await act(async () => {
      renderComponent(
        <>
          <GetStarted />
          <JoinCommunity />
          <CreateUsername />
        </>,
        store
      )
    })

    await userEvent.click(await screen.findByTestId('join-with-invite-link'))
    expect(await screen.findByRole('heading', { name: 'Join with invite link', level: 3 })).toBeVisible()

    // The link arrives through the OS custom protocol, the way every deep link does
    await act(async () => {
      store.dispatch(communities.actions.customProtocol([composeInvitationDeepUrl(invitationCodes)]))
    })

    expect(await screen.findByText('Choose username')).toBeVisible()

    // Closing username registration returns to the screen the link arrived on, not to Get started
    await userEvent.click(await screen.findByTestId('createUsernameModalClose'))
    expect(await screen.findByRole('heading', { name: 'Join with invite link', level: 3 })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Let’s get started...' })).not.toBeInTheDocument()
  })
})
