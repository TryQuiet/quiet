import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../root.reducer'
import { Store } from '../../store.types'
import { prepareStore } from '../../../tests/utils/prepareStore'
import { communities, getReduxStoreFactory } from '@quiet/state-manager'
import { initActions } from '../init.slice'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { deepLinkSaga, DEEP_LINK_CONNECTION_TIMEOUT_MS } from './deepLink.saga'
import { initMasterSaga } from '../init.master.saga'
import { runSaga, stdChannel } from 'redux-saga'
import { NativeModules } from 'react-native'
import {
  type Community,
  InvitationData,
  type InvitationDataV4,
  InvitationDataVersion,
  JoinCommunityPayload,
} from '@quiet/types'
import { composeInvitationShareUrl, getValidInvitationUrlTestData, validInvitationDatav4 } from '@quiet/common'
import { FactoryGirl } from 'factory-girl'

describe('deepLinkSaga', () => {
  let store: Store
  let factory: FactoryGirl
  const { code } = getValidInvitationUrlTestData(validInvitationDatav4[0])

  const validCode = code()
  const validData = validInvitationDatav4[0]

  const id = '00d045ab'
  let community: Community

  beforeEach(async () => {
    store = (await prepareStore()).store
    factory = await getReduxStoreFactory(store)
  })

  test('joins community', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )
    const joinCommunityPayload: JoinCommunityPayload = {
      inviteData: validData,
    }
    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(validCode))
      .withReducer(reducer)
      .withState(store.getState())
      .put(initActions.resetDeepLink())
      .put(communities.actions.joinCommunity(joinCommunityPayload))
      .put(
        navigationActions.replaceScreen({
          screen: ScreenNames.UsernameRegistrationScreen,
        })
      )
      .run()
  })

  test.each([false, true])('bounds the wait and retains the invitation (native unavailable=%s)', async unavailable => {
    jest.useFakeTimers()
    if (unavailable) {
      const handleIncomingEvents = NativeModules.CommunicationModule.handleIncomingEvents as jest.Mock
      handleIncomingEvents.mockImplementation(() => {
        throw new Error('Native bridge unavailable')
      })
    }
    const actions: any[] = []
    const channel = stdChannel()
    const dispatch = (action: any) => {
      actions.push(action)
      store.dispatch(action)
      channel.put(action)
    }
    const task = runSaga({ channel, dispatch, getState: store.getState }, initMasterSaga)
    try {
      dispatch(initActions.deepLink(validCode))
      await jest.advanceTimersByTimeAsync(DEEP_LINK_CONNECTION_TIMEOUT_MS)
      const failure = actions.find(
        action =>
          action.type === navigationActions.replaceScreen.type && action.payload.screen === ScreenNames.ErrorScreen
      )
      expect(failure.payload.params.title).toBe("Couldn't open invitation")
      expect(task.isRunning()).toBe(true)
      expect(actions.filter(action => action.type === communities.actions.joinCommunity.type)).toHaveLength(0)

      // Recovery becomes possible after the error is shown. The actual button's
      // callback must preserve this invitation, not route to an empty join form.
      dispatch(initActions.setWebsocketConnected({ dataPort: 12345, socketIOSecret: 'current-secret' }))
      failure.payload.params.onPress(dispatch)
      await jest.advanceTimersByTimeAsync(0)
      const joins = actions.filter(action => action.type === communities.actions.joinCommunity.type)
      expect(joins).toEqual([communities.actions.joinCommunity({ inviteData: validData })])
      expect(actions).toContainEqual(
        navigationActions.replaceScreen({ screen: ScreenNames.UsernameRegistrationScreen })
      )
      expect(store.getState().Init.deepLinking).toBe(false)
    } finally {
      task.cancel()
      await task.toPromise()
      ;(NativeModules.CommunicationModule.handleIncomingEvents as jest.Mock).mockReset()
      jest.useRealTimers()
    }
  })

  test('displays error if user already belongs to a community', async () => {
    community = await factory.create('Community', {
      id,
      name: 'rockets',
    })
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )

    store.dispatch(communities.actions.addNewCommunity(community))
    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(validCode))
      .withReducer(reducer)
      .withState(store.getState())
      .put.like({
        action: {
          type: navigationActions.replaceScreen.type,
          payload: {
            screen: ScreenNames.ErrorScreen,
          },
        },
      })
      .not.put(
        communities.actions.joinCommunity({
          inviteData: validData,
        })
      )
      .run()
  })

  test("doesn't display error if user is connecting with the same community", async () => {
    community = await factory.create('Community', {
      id,
      name: '',
      psk: validData.psk,
    })
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )

    const joinCommunityPayload: JoinCommunityPayload = {
      inviteData: validData,
    }

    store.dispatch(communities.actions.addNewCommunity(community))

    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(validCode))
      .withReducer(reducer)
      .withState(store.getState())
      .not.put.like({
        action: {
          type: navigationActions.replaceScreen.type,
          payload: {
            screen: ScreenNames.ErrorScreen,
            params: {
              title: 'You already belong to a community',
              message: "We're sorry but for now you can only be a member of a single community at a time",
            },
          },
        },
      })
      .put.like({
        action: {
          type: communities.actions.joinCommunity.type,
          payload: joinCommunityPayload,
        },
      })
      .run()
  })

  test('displays error if invitation code is invalid', async () => {
    const invalidData: InvitationDataV4 = {
      version: InvitationDataVersion.v4,
      pairs: [
        {
          onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
          peerId: '12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx',
        },
      ],
      psk: 'BNlxfE=',
      authData: {
        teamId: 'abc123',
        seed: 'def456',
        communityName: 'foobar',
      },
    }
    const joinCommunityPayload: JoinCommunityPayload = {
      inviteData: invalidData,
    }
    const invalidCode = composeInvitationShareUrl(invalidData)
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )
    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(invalidCode))
      .withReducer(reducer)
      .withState(store.getState())
      .put.like({
        action: {
          type: navigationActions.replaceScreen.type,
          payload: {
            screen: ScreenNames.ErrorScreen,
            params: {
              title: 'Invalid invitation link',
              message: 'Please check your invitation link and try again',
            },
          },
        },
      })
      .not.put(communities.actions.joinCommunity(joinCommunityPayload))
      .run()
  })
})
