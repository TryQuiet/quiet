import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { act } from '@testing-library/react-native'
import { AnyAction } from 'redux'
import { take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../setupTests'
import { prepareStore } from './utils/prepareStore'
import { renderComponent } from './utils/renderComponent'
import { initActions } from '../store/init/init.slice'
import { validInvitationCodeTestData, getValidInvitationUrlTestData } from '@quiet/common'
import { communities, getBaseTypesFactory, getSocketFactory, identity } from '@quiet/state-manager'
import { RegisterUsernamePayload, SocketActions, socketEventData } from '@quiet/types'
import { createLogger } from '../utils/logger'
import { FactoryGirl } from 'factory-girl'

const logger = createLogger('deepLinking:test')

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
    const { store, runSaga, root } = await prepareStore({}, socket)
    logger.info('Store prepared')

    // Log all the dispatched actions in order
    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action = yield* take()
        logger.info('action', action.type.toString(), (action as AnyAction).payload)
        actions.push(action.type)
      }
    })

    logger.info('rendering component')
    renderComponent(<></>, store)
    logger.info('component rendered')

    store.dispatch(initActions.deepLink(getValidInvitationUrlTestData(validInvitationCodeTestData[0]).code()))

    const registerUsernamePayload: RegisterUsernamePayload = {
      nickname: 'testUser',
    }
    store.dispatch(identity.actions.registerUsername(registerUsernamePayload))

    await act(async () => {})
    logger.info('act done')

    // expect community to have been created
    expect(actions).toMatchInlineSnapshot(`
      [
        "Init/deepLink",
        "Init/resetDeepLink",
        "Communities/joinCommunity",
        "Communities/setInvitationCodes",
        "Navigation/replaceScreen",
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
    store.dispatch(initActions.deepLink(getValidInvitationUrlTestData(validInvitationCodeTestData[1]).code()))
    store.dispatch(identity.actions.registerUsername(registerUsernamePayload))
    await act(async () => {})
    logger.info('act done')

    const currentPair = communities.selectors.invitationCodes(store.getState())
    logger.info('currentPair', currentPair)

    expect(originalPair).toEqual(currentPair)

    expect(actions).toMatchInlineSnapshot(`
      [
        "Init/deepLink",
        "Init/resetDeepLink",
        "Communities/joinCommunity",
        "Communities/setInvitationCodes",
        "Navigation/replaceScreen",
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
        "Init/deepLink",
        "Init/resetDeepLink",
        "Navigation/replaceScreen",
        "Identity/registerUsername",
        "Identity/setUsername",
      ]
    `)
    // joinCommunity should not be called again
    // Communities/joinCommunity should only be in actions once
    expect(actions.filter(action => action.toString() === 'Communities/joinCommunity')).toHaveLength(1)
    root?.cancel()
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
    jest.spyOn(socket, 'emit').mockImplementation(mockEmitImpl)
    // @ts-ignore
    socket.emitWithAck = mockEmitImpl
    const { store, runSaga, root } = await prepareStore({}, socket)
    logger.info('Store prepared')

    // Log all the dispatched actions in order
    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action = yield* take()
        actions.push(action.type)
      }
    })

    renderComponent(<></>, store)

    store.dispatch(initActions.deepLink(getValidInvitationUrlTestData(validInvitationCodeTestData[0]).code()))

    const registerUsernamePayload: RegisterUsernamePayload = {
      nickname: 'testUser',
    }
    store.dispatch(identity.actions.registerUsername(registerUsernamePayload))

    await act(async () => {})
    logger.info('act done')

    // expect community to have been created
    expect(actions).toMatchInlineSnapshot(`
      [
        "Init/deepLink",
        "Init/resetDeepLink",
        "Communities/joinCommunity",
        "Communities/setInvitationCodes",
        "Navigation/replaceScreen",
        "Identity/registerUsername",
        "Identity/setUsername",
        "Communities/clearInvitationCodes",
      ]
    `)
    const originalPair = communities.selectors.invitationCodes(store.getState())
    logger.info('originalPair', originalPair)
    // Redo the action to provoke renewed saga runs
    store.dispatch(initActions.deepLink(getValidInvitationUrlTestData(validInvitationCodeTestData[1]).code()))

    store.dispatch(identity.actions.registerUsername(registerUsernamePayload))
    await act(async () => {})
    logger.info('act done')

    const currentPair = communities.selectors.invitationCodes(store.getState())
    logger.info('currentPair', currentPair)

    expect(originalPair).toEqual(currentPair)

    expect(actions).toMatchInlineSnapshot(`
      [
        "Init/deepLink",
        "Init/resetDeepLink",
        "Communities/joinCommunity",
        "Communities/setInvitationCodes",
        "Navigation/replaceScreen",
        "Identity/registerUsername",
        "Identity/setUsername",
        "Communities/clearInvitationCodes",
        "Init/deepLink",
        "Init/resetDeepLink",
        "Communities/joinCommunity",
        "Communities/setInvitationCodes",
        "Navigation/replaceScreen",
        "Identity/registerUsername",
        "Identity/setUsername",
        "Communities/clearInvitationCodes",
      ]
    `)
    root?.cancel()
  })
})
