import { PrepareStore, prepareStore } from '../../testUtils/prepareStore'
import MockedSocket from 'socket.io-mock'
import { communities, CreatedChannelResponse, getFactory, identity, IncomingMessages, MessageType, messages, publicChannels, users } from '@quiet/state-manager'
import { keyFromCertificate, parseCertificate } from '@quiet/identity'
import { ioMock } from '../../../shared/setupTests'
import { DateTime } from 'luxon'
const originalNotification = window.Notification
const mockNotification = {
  onclose: jest.fn(),
  onclick: jest.fn()
}

jest.mock('../../../shared/sounds', () => ({
  // @ts-expect-error
  ...jest.requireActual('../../../shared/sounds'),
  soundTypeToAudio: {
    pow: {
      play: jest.fn()
    }
  }
}))

describe('displayMessageNotificationSaga test', () => {
  let incomingMessages: IncomingMessages
  let store: PrepareStore
  let publicChannel: CreatedChannelResponse
  let socket: MockedSocket
  let notification: any

  afterEach(async () => {
    window.Notification = originalNotification
  })

  beforeEach(async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    notification = jest.fn().mockImplementation(() => { return mockNotification })
    window.Notification = notification

    store = await prepareStore({}, socket)

    const factory = await getFactory(store.store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    publicChannel = await factory.create<
    ReturnType<typeof publicChannels.actions.addChannel>['payload']
    >('PublicChannel', { communityId: community.id })

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const bob = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'bob' })

    const parsedCert = parseCertificate(alice.userCertificate)
    const userPubKey = keyFromCertificate(parsedCert)

    const senderPubKey = Object.keys(users.selectors.certificatesMapping(store.store.getState()))
      .find((pubKey) => pubKey !== userPubKey)

    const message = (
      await factory.build<typeof publicChannels.actions.test_message>('Message', {
        identity: bob,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: publicChannel.channel.address,
          signature: '',
          pubKey: senderPubKey
        },
        verifyAutomatically: true
      })
    ).payload.message

    incomingMessages = {
      messages: [message],
      communityId: community.id
    }
  })

  it('clicking in notification takes you to message in relevant channel and ends emit', async () => {
    store.store.dispatch(messages.actions.incomingMessages(incomingMessages))
    // simulate click on notification
    mockNotification.onclick()
    const isTakeEveryResolved = store.sagaMonitor.isEffectResolved('takeEvery(channel, bridgeAction)')
    expect(publicChannels.selectors.currentChannelAddress(store.store.getState())).toBe(publicChannel.channel.address)
    expect(isTakeEveryResolved).toBeTruthy()
  })

  it('closing notification ends emit', async () => {
    store.store.dispatch(messages.actions.incomingMessages(incomingMessages))
    // simulate close notification
    mockNotification.onclose()
    const isTakeEveryResolved = store.sagaMonitor.isEffectResolved('takeEvery(channel, bridgeAction)')
    expect(isTakeEveryResolved).toBeTruthy()
  })
})
