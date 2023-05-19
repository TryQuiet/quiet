import { keyFromCertificate, parseCertificate, setupCrypto } from '@quiet/identity'
import { Store } from '../store.types'
import { getFactory, Identity, publicChannels } from '../..'
import { prepareStore } from '../../utils/tests/prepareStore'
import { validCurrentPublicChannelMessagesEntries } from './messages.selectors'
import { ChannelMessage, PublicChannel } from '../publicChannels/publicChannels.types'
import { communitiesActions, Community } from '../communities/communities.slice'
import { identityActions } from '../identity/identity.slice'
import { FactoryGirl } from 'factory-girl'
import { selectGeneralChannel } from '../publicChannels/publicChannels.selectors'

describe('messagesSelectors', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community

  let generalChannel: PublicChannel

  let alice: Identity
  let john: Identity

  beforeAll(async () => {
    setupCrypto()

    // Set date display format
    process.env.LC_ALL = 'en_US.UTF-8'

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    generalChannel = selectGeneralChannel(store.getState())

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    john = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'john' }
    )
  })

  it('filter out unverified messages', async () => {
    const johnPublicKey = keyFromCertificate(parseCertificate(john.userCertificate))

    // Build messages
    const authenticMessage: ChannelMessage = {
      ...(
        await factory.build<typeof publicChannels.actions.test_message>('Message', {
          identity: alice
        })
      ).payload.message,
      id: Math.random().toString(36).substr(2.9),
      channelId: generalChannel.id
    }

    const spoofedMessage: ChannelMessage = {
      ...(
        await factory.build<typeof publicChannels.actions.test_message>('Message', {
          identity: alice
        })
      ).payload.message,
      id: Math.random().toString(36).substr(2.9),
      channelId: generalChannel.id,
      pubKey: johnPublicKey
    }

    // Store messages
    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      { identity: alice, message: authenticMessage, verifyAutomatically: true }
    )

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      { identity: alice, message: spoofedMessage, verifyAutomatically: true }
    )

    store.dispatch(
      publicChannels.actions.setCurrentChannel({
        channelId: generalChannel.id
      })
    )

    const messages = validCurrentPublicChannelMessagesEntries(store.getState())

    expect(messages.length).toBe(1)

    expect(messages[0].id).toBe(authenticMessage.id)
  })
})
