import { keyFromCertificate, parseCertificate, pubKeyFromCsr, setupCrypto } from '@quiet/identity'
import { type Store } from '../store.types'
import { getFactory, publicChannels } from '../..'
import { prepareStore } from '../../utils/tests/prepareStore'
import { getMessagesFromChannelIdByPubKey, validCurrentPublicChannelMessagesEntries } from './messages.selectors'
import { type communitiesActions } from '../communities/communities.slice'
import { type identityActions } from '../identity/identity.slice'
import { type FactoryGirl } from 'factory-girl'
import { publicChannelsSelectors, selectGeneralChannel } from '../publicChannels/publicChannels.selectors'
import { type Community, type Identity, type PublicChannel, type ChannelMessage } from '@quiet/types'
import { getCurrentTime } from './utils/message.utils'
import { publicChannelsActions } from '../publicChannels/publicChannels.slice'
import { generateChannelId } from '@quiet/common'
import { DateTime } from 'luxon'

describe('messagesSelectors', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let generalChannel: PublicChannel
  let devChannel: PublicChannel
  let generalChannelId: string

  let alice: Identity
  let john: Identity

  beforeEach(async () => {
    setupCrypto()

    // Set date display format
    process.env.LC_ALL = 'en_US.UTF-8'

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()
    expect(generalChannel).toBeDefined()
    generalChannelId = generalChannel?.id || ''

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })

    john = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
    })

    devChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'general',
          description: 'Welcome to #dev',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          id: generateChannelId('dev'),
        },
      })
    ).channel
  })

  it('filter out unverified messages', async () => {
    expect(john.userCertificate).not.toBeNull()
    const johnPublicKey = keyFromCertificate(parseCertificate(john.userCertificate || ''))

    // Build messages
    const authenticMessage: ChannelMessage = {
      ...(
        await factory.build<typeof publicChannels.actions.test_message>('Message', {
          identity: alice,
        })
      ).payload.message,
      id: Math.random().toString(36).substr(2.9),
      channelId: generalChannel.id,
    }

    const spoofedMessage: ChannelMessage = {
      ...(
        await factory.build<typeof publicChannels.actions.test_message>('Message', {
          identity: alice,
        })
      ).payload.message,
      id: Math.random().toString(36).substr(2.9),
      channelId: generalChannel.id,
      pubKey: johnPublicKey,
    }

    // Store messages
    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>('Message', {
      identity: alice,
      message: authenticMessage,
      verifyAutomatically: true,
    })

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>('Message', {
      identity: alice,
      message: spoofedMessage,
      verifyAutomatically: true,
    })

    store.dispatch(
      publicChannels.actions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const messages = validCurrentPublicChannelMessagesEntries(store.getState())

    expect(messages.length).toBe(1)

    expect(messages[0].id).toBe(authenticMessage.id)
  })

  describe('getMessagesFromChannelIdByPubKey - return messages related to pubkey from the specific channel in chronological order', () => {
    const generateMessage = async (identity: Identity, channelId: string) => {
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>('Message', {
        identity,
        message: {
          ...(
            await factory.build<typeof publicChannels.actions.test_message>('Message', {
              identity,
            })
          ).payload.message,
          id: Math.random().toString(36).substr(2.9),
          channelId,
          createdAt: getCurrentTime(),
        },
        verifyAutomatically: true,
      })
    }
    it('return only Alice messages from general channel - included John messages', async () => {
      const aliceCsr = alice.userCsr?.userCsr
      if (!aliceCsr) return

      const arrLength = 3

      for await (const _i of new Array(arrLength)) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 500))
        await generateMessage(alice, generalChannel.id)
        await generateMessage(john, generalChannel.id)
      }

      const messages = getMessagesFromChannelIdByPubKey(generalChannel.id, pubKeyFromCsr(aliceCsr))(store.getState())
      expect(messages.length).toEqual(arrLength)
      expect(messages[0].createdAt).toBeLessThan(messages[2].createdAt)
    })

    it('return only Alice messages from general channel - included Alice messages on other channel', async () => {
      const aliceCsr = alice.userCsr?.userCsr
      if (!aliceCsr) return

      const arrLength = 3

      for await (const _i of new Array(arrLength)) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 500))
        await generateMessage(alice, generalChannel.id)
        await generateMessage(alice, devChannel.id)
      }

      const messages = getMessagesFromChannelIdByPubKey(generalChannel.id, pubKeyFromCsr(aliceCsr))(store.getState())
      expect(messages.length).toEqual(arrLength)
      expect(messages[0].createdAt).toBeLessThan(messages[2].createdAt)
    })
  })
})
