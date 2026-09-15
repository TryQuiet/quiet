import { AppState, NativeModules, Platform } from 'react-native'
import Config from 'react-native-config'
import { runSaga } from 'redux-saga'
import { showNotificationSaga } from './showNotification.saga'
import {
  publicChannels,
  PUSH_NOTIFICATION_CHANNEL,
  getReduxStoreFactory,
  prepareStore,
  Store,
  identity,
  getBaseTypesFactory,
} from '@quiet/state-manager'
import { StoreKeys } from '../../store.keys'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { NavigationState } from '../../navigation/navigation.slice'
import { ChannelMessage, Community, Identity, MessageType, PublicChannel } from '@quiet/types'
import { generateTestChannelId } from '@quiet/common'

describe('showNotificationSaga', () => {
  let store: Store
  let alice: Identity
  let channel: PublicChannel
  let message: ChannelMessage
  let navigation: NavigationState
  const originalPlatform = Platform.OS
  const originalAppState = AppState.currentState
  const originalForegroundAllowed = Config.FOREGROUND_PUSH_NOTIFICATIONS_ALLOWED

  beforeEach(async () => {
    Platform.OS = 'android'
    AppState.currentState = 'active'
    Config.FOREGROUND_PUSH_NOTIFICATIONS_ALLOWED = 'true'
    NativeModules.CommunicationModule.handleIncomingEvents = jest.fn()
    navigation = { ...new NavigationState(), backStack: [ScreenNames.ChannelScreen] }

    store = prepareStore().store
    const factory = await getReduxStoreFactory(store)
    const baseTypes = await getBaseTypesFactory()
    const community: Community = await factory.create('Community')
    alice = await factory.create('Identity', { communityId: community.id, userId: 'self-id' })
    // Identical display names must not cause someone else's message to be filtered.
    await factory.create('UserProfile', { userId: alice.userId, nickname: 'Alice' })
    await factory.create('UserProfile', { userId: 'other-id', nickname: 'Alice' })
    channel = (
      await factory.create('PublicChannel', {
        channel: {
          id: generateTestChannelId('photo'),
          name: 'photo',
          description: 'Welcome to #photo',
          timestamp: Date.now(),
          owner: alice.userId,
          public: true,
        },
      })
    ).channel
    message = await baseTypes.create('ChannelMessage', {
      id: 'message-id',
      channelId: channel.id,
      createdAt: Math.floor(Date.now() / 1000),
      message: 'hello',
      userId: 'other-id',
      type: MessageType.Basic,
    })
    expect(identity.selectors.currentIdentity(store.getState())?.userId).toBe('self-id')
  })

  afterEach(() => {
    Platform.OS = originalPlatform
    AppState.currentState = originalAppState
    Config.FOREGROUND_PUSH_NOTIFICATIONS_ALLOWED = originalForegroundAllowed
  })

  const notify = async (overrides: Partial<ChannelMessage> = {}) => {
    const incoming = { ...message, ...overrides }
    await runSaga(
      { getState: () => ({ ...store.getState(), [StoreKeys.Navigation]: navigation }) },
      showNotificationSaga,
      publicChannels.actions.markUnreadChannel({ channelId: incoming.channelId, message: incoming })
    ).toPromise()
    return incoming
  }

  it('passes another author with the same nickname to the Android notification bridge', async () => {
    const incoming = await notify()
    expect(NativeModules.CommunicationModule.handleIncomingEvents).toHaveBeenCalledTimes(1)
    expect(NativeModules.CommunicationModule.handleIncomingEvents).toHaveBeenCalledWith(
      PUSH_NOTIFICATION_CHANNEL,
      JSON.stringify({ ...incoming, channelName: channel.name }),
      'Alice'
    )
  })

  it.each([MessageType.Basic, MessageType.Info])(
    'suppresses own type %s messages before calling Android',
    async type => {
      await notify({ userId: alice.userId, type, message: type === MessageType.Info ? 'Created #photo' : 'hello' })
      expect(NativeModules.CommunicationModule.handleIncomingEvents).not.toHaveBeenCalled()
    }
  )

  it('suppresses self in a mixed sequence while delivering the other author', async () => {
    await notify({ id: 'self-before', userId: alice.userId })
    const incoming = await notify()
    await notify({ id: 'self-after', userId: alice.userId })
    expect(NativeModules.CommunicationModule.handleIncomingEvents).toHaveBeenCalledTimes(1)
    expect(NativeModules.CommunicationModule.handleIncomingEvents).toHaveBeenCalledWith(
      PUSH_NOTIFICATION_CHANNEL,
      JSON.stringify({ ...incoming, channelName: channel.name }),
      'Alice'
    )
  })

  it('does not notify while the authenticated local user ID is unavailable', async () => {
    store.dispatch(identity.actions.updateIdentity({ ...alice, userId: '' }))
    await notify({ userId: alice.userId })
    await notify()
    expect(NativeModules.CommunicationModule.handleIncomingEvents).not.toHaveBeenCalled()
  })

  it('leaves background notifications to the backend worker or FCM', async () => {
    AppState.currentState = 'background'
    await notify()
    expect(NativeModules.CommunicationModule.handleIncomingEvents).not.toHaveBeenCalled()
  })

  it('does not notify on the channel list screen', async () => {
    navigation.backStack = [ScreenNames.ChannelListScreen]
    await notify()
    expect(NativeModules.CommunicationModule.handleIncomingEvents).not.toHaveBeenCalled()
  })

  it('respects the foreground notification setting', async () => {
    Config.FOREGROUND_PUSH_NOTIFICATIONS_ALLOWED = 'false'
    await notify()
    expect(NativeModules.CommunicationModule.handleIncomingEvents).not.toHaveBeenCalled()
  })

  it('does not use the Android notification bridge on iOS', async () => {
    Platform.OS = 'ios'
    await notify()
    expect(NativeModules.CommunicationModule.handleIncomingEvents).not.toHaveBeenCalled()
  })

  it('does not notify for a missing sender profile', async () => {
    await notify({ userId: 'unknown-id' })
    expect(NativeModules.CommunicationModule.handleIncomingEvents).not.toHaveBeenCalled()
  })

  it('does not notify for an unknown channel', async () => {
    await notify({ channelId: 'unknown-channel' })
    expect(NativeModules.CommunicationModule.handleIncomingEvents).not.toHaveBeenCalled()
  })
})
