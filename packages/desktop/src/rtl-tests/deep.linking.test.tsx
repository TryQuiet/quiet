import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { AnyAction } from 'redux'
import { take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { getValidInvitationUrlTestData, validInvitationCodeTestData } from '@quiet/common'
import { communities, identity, getBaseTypesFactory, getSocketFactory } from '@quiet/state-manager'
import { createLogger } from './logger'
import { FactoryGirl } from 'factory-girl'
import { RegisterUsernamePayload, SocketActions, socketEventData } from '@quiet/types'
const logger = createLogger('deepLinking')

describe('Deep linking', () => {
  let socket: MockedSocket

  let factory: FactoryGirl
  let baseTypesFactory: FactoryGirl

  beforeEach(async () => {
    factory = await getSocketFactory()
    baseTypesFactory = await getBaseTypesFactory()
    logger.info('Setting up mocked socket')
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    const mockEmitImpl = async (...input: [SocketActions, ...socketEventData<[any]>]) => {
      const action = input[0]
      if (action === SocketActions.JOIN_COMMUNITY) {
        return await factory.build(`${action}_response`, {
          id: input[1].id,
          community: await baseTypesFactory.build('Community', {
            id: input[1].id,
            name: input[1].name,
            psk: input[1].inviteData.psk,
          }),
          identity: await baseTypesFactory.build('Identity', {
            communityId: input[1].id,
            userId: 'commonUserId',
          }),
          profile: await baseTypesFactory.build('UserProfile', {
            userId: input[1].id,
          }),
        })
      }
    }
    jest.spyOn(socket, 'emit').mockImplementation(mockEmitImpl)
    // @ts-ignore
    socket.emitWithAck = mockEmitImpl
    ioMock.mockImplementation(() => socket)
  })

  test('does not trigger joinCommunity again if already in a community', async () => {
    logger.info('does not trigger joinCommunity again if already in a community')
    const { store, runSaga } = await prepareStore({}, socket)
    logger.info('Store prepared')

    // Log all the dispatched actions in order
    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action = yield* take()
        actions.push(action.type)
      }
    })

    logger.info('rendering component')
    renderComponent(<></>, store)
    logger.info('component rendered')

    logger.info('dispatching custom protocol')
    store.dispatch(
      communities.actions.customProtocol([getValidInvitationUrlTestData(validInvitationCodeTestData[0]).deepUrl()])
    )
    logger.info('custom protocol dispatched')

    const registerUsernamePayload: RegisterUsernamePayload = {
      nickname: 'testUser',
    }
    store.dispatch(identity.actions.registerUsername(registerUsernamePayload))

    await act(async () => {})
    logger.info('act done')

    // expect community to have been created
    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Communities/customProtocol",
        "Communities/joinCommunity",
        "Communities/setInvitationCodes",
        "Modals/openModal",
        "Identity/registerUsername",
        "Identity/setUsername",
        "Communities/addNewCommunity",
        "Communities/setCurrentCommunity",
        "Identity/addNewIdentity",
        "Users/setUserProfile",
        "Communities/launchCommunity",
        "Communities/clearInvitationCodes",
        "Communities/setCurrentCommunity",
        "Files/checkForMissingFiles",
        "Network/addInitializedCommunity",
      ]
    `)
    const originalPair = communities.selectors.invitationCodes(store.getState())
    logger.info('originalPair', originalPair)
    // Redo the action to provoke renewed saga runs
    logger.info('dispatching second custom protocol')
    store.dispatch(
      communities.actions.customProtocol([getValidInvitationUrlTestData(validInvitationCodeTestData[1]).deepUrl()])
    )
    logger.info('second custom protocol dispatched')
    store.dispatch(identity.actions.registerUsername(registerUsernamePayload))
    await act(async () => {})
    logger.info('act done')

    const currentPair = communities.selectors.invitationCodes(store.getState())
    logger.info('currentPair', currentPair)

    expect(originalPair).toEqual(currentPair)

    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Communities/customProtocol",
        "Communities/joinCommunity",
        "Communities/setInvitationCodes",
        "Modals/openModal",
        "Identity/registerUsername",
        "Identity/setUsername",
        "Communities/addNewCommunity",
        "Communities/setCurrentCommunity",
        "Identity/addNewIdentity",
        "Users/setUserProfile",
        "Communities/launchCommunity",
        "Communities/clearInvitationCodes",
        "Communities/setCurrentCommunity",
        "Files/checkForMissingFiles",
        "Network/addInitializedCommunity",
        "Communities/customProtocol",
        "Modals/openModal",
        "Identity/registerUsername",
        "Identity/setUsername",
      ]
    `)
  })
  test('triggers joinCommunity again if previous attempt failed', async () => {
    logger.info('triggers joinCommunity again if previous attempt failed')
    const mockEmitImpl = async (...input: [SocketActions, ...socketEventData<[any]>]) => {
      const action = input[0]
      if (action === SocketActions.JOIN_COMMUNITY) {
        // NOTE: this is the key to this test
        // we are returning undefined to simulate a failed joinCommunity
        return undefined
      }
    }
    // Spy on emit, and manually mock emitWithAck
    const spyEmitWithAck = jest.fn(mockEmitImpl)
    // @ts-ignore
    socket.emitWithAck = spyEmitWithAck
    const { store, runSaga } = await prepareStore({}, socket)
    logger.info('Store prepared')

    // Log all the dispatched actions in order
    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action = yield* take()
        actions.push(action.type)
      }
    })

    logger.info('rendering component')
    renderComponent(<></>, store)
    logger.info('component rendered')

    logger.info('dispatching custom protocol')
    store.dispatch(
      communities.actions.customProtocol([getValidInvitationUrlTestData(validInvitationCodeTestData[0]).deepUrl()])
    )
    logger.info('custom protocol dispatched')

    const registerUsernamePayload: RegisterUsernamePayload = {
      nickname: 'testUser',
    }
    store.dispatch(identity.actions.registerUsername(registerUsernamePayload))

    await act(async () => {})
    logger.info('act done')

    // expect community to not have been created
    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Communities/customProtocol",
        "Communities/joinCommunity",
        "Communities/setInvitationCodes",
        "Modals/openModal",
        "Identity/registerUsername",
        "Identity/setUsername",
        "Communities/clearInvitationCodes",
      ]
    `)
    // Check that either emit or emitWithAck was called
    expect(spyEmitWithAck).toHaveBeenCalledTimes(1)

    // Redo the action to provoke renewed saga runs
    logger.info('dispatching second custom protocol')
    store.dispatch(
      communities.actions.customProtocol([getValidInvitationUrlTestData(validInvitationCodeTestData[1]).deepUrl()])
    )
    logger.info('second custom protocol dispatched')
    store.dispatch(identity.actions.registerUsername(registerUsernamePayload))
    await act(async () => {})

    logger.info('act done')
    expect(spyEmitWithAck).toHaveBeenCalledTimes(2)
    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Communities/customProtocol",
        "Communities/joinCommunity",
        "Communities/setInvitationCodes",
        "Modals/openModal",
        "Identity/registerUsername",
        "Identity/setUsername",
        "Communities/clearInvitationCodes",
        "Communities/customProtocol",
        "Communities/joinCommunity",
        "Communities/setInvitationCodes",
        "Modals/openModal",
        "Identity/registerUsername",
        "Identity/setUsername",
        "Communities/clearInvitationCodes",
      ]
    `)
  })
})
