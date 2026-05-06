import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import { prepareStore, testReducers } from '../renderer/testUtils/prepareStore'
import { renderComponent } from '../renderer/testUtils'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { communities, identity } from '@quiet/state-manager'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import JoinCommunity from '../renderer/components/CreateJoinCommunity/JoinCommunity/JoinCommunity'
import CreateUsername from '../renderer/components/CreateUsername/CreateUsername'
import {
  CommunityOwnership,
  InvitationDataVersion,
  type Community,
  type InvitationData,
  type Identity,
} from '@quiet/types'
import { composeInvitationDeepUrl } from '@quiet/common'
import { act } from '@testing-library/react'
import { createLogger } from './logger'

const logger = createLogger('customProtocol.test')

jest.setTimeout(20_000)

describe('Opening app through custom protocol', () => {
  let socket: MockedSocket

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

    const invitationCodes: InvitationData = {
      version: InvitationDataVersion.v1,
      pairs: [
        {
          peerId: 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
          onionAddress: 'bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd',
        },
      ],
      psk: 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw=',
      ownerOrbitDbIdentity: '018f9e87541d0b61cb4565af8df9699f658116afc54ae6790c31bbf6df3fc343b0', // 64-char hex
    }

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
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()
  })
})
