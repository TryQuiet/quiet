import { Store } from '@reduxjs/toolkit'
import { prepareStore } from '../../testUtils/prepareStore'
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
  let store: Store
  let socket: MockedSocket

  let notification

  let incomingMessages: IncomingMessages

  let publicChannel: CreatedChannelResponse
  
  afterEach(async () => {
    window.Notification = originalNotification
  })

  beforeEach(async () => {
    socket = new MockedSocket()

    ioMock.mockImplementation(() => socket)

    notification = jest.fn().mockImplementation(() => { return mockNotification })

    window.Notification = notification

    store = (await prepareStore()).store

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    publicChannel = await factory.create<
    ReturnType<typeof publicChannels.actions.addChannel>['payload']
    >('PublicChannel')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const bob = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'bob' })

    const parsedCert = parseCertificate(alice.userCertificate)
    const userPubKey = keyFromCertificate(parsedCert)

    const senderPubKey = Object.keys(users.selectors.certificatesMapping(store.getState()))
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
      messages: [message]
    }
  })

  it('clicking on notification takes you to the message in relevant channel', async () => {
    store.dispatch(messages.actions.incomingMessages(incomingMessages))
    // Simulate clicking on notification
    mockNotification.onclick()
    const currentChannel = publicChannels.selectors.currentChannelAddress(store.getState())
    expect(currentChannel).toBe(publicChannel.channel.address)
  })
})
