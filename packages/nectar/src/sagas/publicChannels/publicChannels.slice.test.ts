import { Store } from 'redux'
import { setupCrypto } from '@quiet/identity'
import { currentChannel, publicChannelsSelectors } from './publicChannels.selectors'
import { publicChannelsActions } from './publicChannels.slice'
import { PublicChannel } from './publicChannels.types'
import { communitiesActions, Community } from '../communities/communities.slice'
import { FactoryGirl } from 'factory-girl'
import { prepareStore } from '../../utils/tests/prepareStore'
import { getFactory } from '../../utils/tests/factories'
import { identityActions } from '../identity/identity.slice'
import { Identity } from '../identity/identity.types'
import { DateTime } from 'luxon'

describe('publicChannelsReducer', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity
  let generalChannel: PublicChannel
  let quietChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    generalChannel = currentChannel(store.getState())

    quietChannel = (
      await factory.build<typeof publicChannelsActions.addChannel>('PublicChannel', {
        communityId: community.id,
        channel: {
          name: 'quiet',
          description: 'Welcome to #quiet',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          address: 'quiet'
        }
      })
    ).payload.channel
  })

  it('responseGetPublicChannels should set channels info', () => {
    store.dispatch(
      publicChannelsActions.responseGetPublicChannels({
        communityId: community.id,
        channels: {
          [generalChannel.address]: generalChannel,
          [quietChannel.address]: quietChannel
        }
      })
    )
    const channels = publicChannelsSelectors.publicChannels(store.getState())
    expect(channels.length).toBe(2)
  })
})
