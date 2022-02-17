import { prepareStore } from '../../testUtils/prepareStore'
import rootSaga from '../../sagas/index.saga'
import { channelMessagesAdapter, communities, CommunityChannels, communityChannelsAdapter, getFactory, identity, IncomingMessages, NotificationsOptions, PublicChannel, publicChannels, publicChannelsAdapter, settings, StoreKeys, unreadMessagesAdapter } from '@quiet/nectar'
import { setupCrypto } from '@quiet/identity'
import { waitFor } from '@testing-library/react'

const originalNotification = window.Notification
const mockNotification = jest.fn()
const notification = jest.fn().mockImplementation(() => { return mockNotification })
// @ts-expect-error
window.Notification = notification

jest.mock('../../../shared/sounds', () => ({
  // @ts-expect-error
  ...jest.requireActual('../../../shared/sounds'),
  soundTypeToAudio: {
    pow: {
      play: jest.fn()
    }
  }
}))
jest.mock('electron', () => {
  return {
    remote:
    {
      BrowserWindow: {
        getAllWindows: () => {
          return [{
            show: jest.fn(),
            isFocused: jest.fn()
          }]
        }
      }
    }
  }
})

let incomingMessages: IncomingMessages
let storeReducers
let communityChannels: CommunityChannels
let store
const incomingMessagesChannelId = 'incomingMessagesChannelId'

beforeAll(async () => {
  incomingMessages = {
    messages: [{
      id: 'id',
      type: 1,
      message: 'message',
      createdAt: 1000000,
      channelAddress: incomingMessagesChannelId,
      signature: 'signature',
      pubKey: 'pubKey'
    }],
    communityId: '1'
  }

  const publicChannel: PublicChannel = {
    name: 'general',
    description: 'description',
    owner: 'user',
    timestamp: 0,
    address: 'general'
  }

  const publicChannel2: PublicChannel = {
    name: incomingMessagesChannelId,
    description: 'description',
    owner: 'user',
    timestamp: 0,
    address: incomingMessagesChannelId
  }

  communityChannels = {
    id: '1',
    currentChannel: publicChannel.address,
    channels: publicChannelsAdapter.setAll(
      publicChannelsAdapter.getInitialState(),
      [publicChannel, publicChannel2]
    ),
    channelMessages: channelMessagesAdapter.getInitialState(),
    channelLoadingSlice: 0,
    unreadMessages: unreadMessagesAdapter.getInitialState()
  }

  storeReducers = {
    [StoreKeys.Settings]: {
      ...new settings.State(),
      notificationsOption: NotificationsOptions.notifyForEveryMessage
    },
    [StoreKeys.PublicChannels]: {
      ...new publicChannels.State(),
      channels: communityChannelsAdapter.setAll(
        communityChannelsAdapter.getInitialState(),
        [communityChannels]
      )
    }
  }

  setupCrypto()
  store = await prepareStore(storeReducers)
  const factory = await getFactory(store.store)

  const community1 = await factory.create<
  ReturnType<typeof communities.actions.addNewCommunity>['payload']
  >('Community')

  const userIdentity = await factory.create<
  ReturnType<typeof identity.actions.addNewIdentity>['payload']
  >('Identity', { id: community1.id, nickname: 'alice' })
})

afterAll(() => {
  window.Notification = originalNotification
})

describe('displayMessageNotificationSaga', () => {
  it('clicking in notification takes you to message in relevant channel', async () => {
    store.runSaga(rootSaga)
    store.store.dispatch(publicChannels.actions.incomingMessages(incomingMessages))
    // simulate click on notification
    // @ts-expect-error
    mockNotification.onclick()
    await waitFor(() => expect(publicChannels.selectors.currentChannel(store.store.getState())).toBe(incomingMessagesChannelId)
    )
  })
})
