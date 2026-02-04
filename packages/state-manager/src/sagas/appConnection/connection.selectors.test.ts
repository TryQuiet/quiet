import { setupCrypto } from '@quiet/identity'
import { type Store } from '@reduxjs/toolkit'
import { getBaseTypesFactory, getReduxStoreFactory } from '../../utils/tests/factories'
import { prepareStore, testReducers } from '../../utils/tests/prepareStore'
import { connectionSelectors } from './connection.selectors'
import { communitiesActions } from '../communities/communities.slice'
import { connectionActions } from './connection.slice'
import { InvitationDataVersion, InvitationPair, UserProfile, type Community } from '@quiet/types'
import { composeInvitationShareUrl, createLibp2pAddress, p2pAddressesToPairs } from '@quiet/common'
import { Base58 } from '3rd-party/auth/packages/crypto/dist'
import { communitiesSelectors } from '../communities/communities.selectors'
import { createLogger } from '../../utils/logger'
import { networkSelectors } from '../network/network.selectors'
import { publicChannelsSelectors } from '../publicChannels/publicChannels.selectors'
import { networkActions } from '../network/network.slice'
import { identityActions } from '../identity/identity.slice'
import { identitySelectors } from '../identity/identity.selectors'
import { usersActions } from '../users/users.slice'

const logger = createLogger('connection.selectors.test')

describe('communitiesSelectors', () => {
  setupCrypto()

  it('select peers sorted by quality', async () => {
    const store = prepareStore().store
    const factory = await getReduxStoreFactory(store)
    const baseTypesFactory = await getBaseTypesFactory()

    const community = await factory.create('Community', {
      peerList: [
        '/dns4/ubapl2lfxci5cc35oegshdsjhlt656xo6vbmztpb2ndb6ftqjjuv5myd.onion/tcp/80/ws/p2p/12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx',
        '/dns4/rjdhzqgrl3bzu4v5cwfla3tafjtdeuzeapk34qvf7mvfhc3hih5fmnqd.onion/tcp/80/ws/p2p/12D3KooWHgLdRMqkepNiYnrur21cyASUNk1f9NZ5tuGa9He8QXNa',
        '/dns4/kkzkv2u53aehfjz7mqgnt3mp2hemcr2h74vtmxpxuh4a5yna7kltsiqd.onion/tcp/80/ws/p2p/12D3KooWPYjyHnYYwe3kzEESMVbpAUHkQyEQpRHehH8QYtGRntVn',
        '/dns4/hricycxramxkn4v46b3pllnozfop6fkl7xdfk2htboe3zakhq3ephjid.onion/tcp/80/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN3qY',
        '/dns4/f3lupwnhaqplbn4djaut5rtipwmlotlb57flfvjzgexek2yezlpjddid.onion/tcp/80/ws/p2p/12D3KooWEHzmff5kZAvyU6Diq5uJG8QkWJxFNUcBLuWjxUGvxaqw',
      ],
    })

    // This peer should be first in the list as it is the most recently seen one.
    store.dispatch(
      connectionActions.updateNetworkData({
        peer: '12D3KooWEHzmff5kZAvyU6Diq5uJG8QkWJxFNUcBLuWjxUGvxaqw',
        address:
          '/dns4/f3lupwnhaqplbn4djaut5rtipwmlotlb57flfvjzgexek2yezlpjddid.onion/tcp/80/ws/p2p/12D3KooWEHzmff5kZAvyU6Diq5uJG8QkWJxFNUcBLuWjxUGvxaqw',
        connectionDuration: 50,
        lastSeen: 1000,
      })
    )

    // This peer should be second as it has the most shared uptime
    store.dispatch(
      connectionActions.updateNetworkData({
        peer: '12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx',
        address:
          '/dns4/ubapl2lfxci5cc35oegshdsjhlt656xo6vbmztpb2ndb6ftqjjuv5myd.onion/tcp/80/ws/p2p/12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx',
        connectionDuration: 500,
        lastSeen: 900,
      })
    )

    // This is actually the third one on the list of last seen peers and it goes next, note that the upper peer which should go before that is already in the list.
    store.dispatch(
      connectionActions.updateNetworkData({
        peer: '12D3KooWHgLdRMqkepNiYnrur21cyASUNk1f9NZ5tuGa9He8QXNa',
        address:
          '/dns4/rjdhzqgrl3bzu4v5cwfla3tafjtdeuzeapk34qvf7mvfhc3hih5fmnqd.onion/tcp/80/ws/p2p/12D3KooWHgLdRMqkepNiYnrur21cyASUNk1f9NZ5tuGa9He8QXNa',
        connectionDuration: 200,
        lastSeen: 500,
      })
    )

    // This is the least valuable peer so it goes last. Rmaining peers, without any network data will be concated to the end of the list.
    store.dispatch(
      connectionActions.updateNetworkData({
        peer: '12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN3qY',
        address:
          '/dns4/hricycxramxkn4v46b3pllnozfop6fkl7xdfk2htboe3zakhq3ephjid.onion/tcp/80/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN3qY',
        connectionDuration: 100,
        lastSeen: 100,
      })
    )

    const expectedArray = [
      '/dns4/f3lupwnhaqplbn4djaut5rtipwmlotlb57flfvjzgexek2yezlpjddid.onion/tcp/80/ws/p2p/12D3KooWEHzmff5kZAvyU6Diq5uJG8QkWJxFNUcBLuWjxUGvxaqw',
      '/dns4/ubapl2lfxci5cc35oegshdsjhlt656xo6vbmztpb2ndb6ftqjjuv5myd.onion/tcp/80/ws/p2p/12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx',
      '/dns4/rjdhzqgrl3bzu4v5cwfla3tafjtdeuzeapk34qvf7mvfhc3hih5fmnqd.onion/tcp/80/ws/p2p/12D3KooWHgLdRMqkepNiYnrur21cyASUNk1f9NZ5tuGa9He8QXNa',
      '/dns4/hricycxramxkn4v46b3pllnozfop6fkl7xdfk2htboe3zakhq3ephjid.onion/tcp/80/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN3qY',
      '/dns4/kkzkv2u53aehfjz7mqgnt3mp2hemcr2h74vtmxpxuh4a5yna7kltsiqd.onion/tcp/80/ws/p2p/12D3KooWPYjyHnYYwe3kzEESMVbpAUHkQyEQpRHehH8QYtGRntVn',
    ]

    const userProfiles: UserProfile[] = []
    for (const [i, peer] of expectedArray.entries()) {
      const onionAddress = peer.split('/')[2]
      const peerId = peer.split('/')[7]
      const userProfile = {
        userId: peerId,
        userData: {
          onionAddress,
          peerId,
        },
      } as UserProfile
      userProfiles.push(userProfile)
    }
    store.dispatch(usersActions.setUserProfiles(userProfiles))

    const peersList = connectionSelectors.peerList(store.getState())
    expect(peersList).toMatchObject(expectedArray)
  })

  it('select socketIOSecret', async () => {
    const store = prepareStore().store

    const secret = 'secret'
    const socketIOSecret = connectionSelectors.socketIOSecret(store.getState())

    expect(socketIOSecret).toBeNull()

    store.dispatch(connectionActions.setSocketIOSecret(secret))

    const socketIOSecret2 = connectionSelectors.socketIOSecret(store.getState())

    expect(socketIOSecret2).toEqual(secret)
  })

  it('invitationUrl selector does not break if there is no community or long lived invite', () => {
    const { store } = prepareStore()
    const invitationUrl = connectionSelectors.invitationUrl(store.getState())
    expect(invitationUrl).toEqual('')
  })

  it('invitationUrl selector returns proper v2 url when community and long lived invite are defined', async () => {
    const store = prepareStore().store
    const factory = await getReduxStoreFactory(store)

    logger.info('invitationUrl selector returns proper v2 url when community and long lived invite are defined')
    const psk = '12345'
    const ownerOrbitDbIdentity = 'testOwnerOrbitDbIdentity'
    await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community', {
      psk,
      ownerOrbitDbIdentity,
    })
    const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      communityId: communitiesSelectors.currentCommunity(store.getState())!.id,
    })
    expect(identitySelectors.currentPeerAddress(store.getState())).toEqual(
      createLibp2pAddress(identity.networkInfo.hiddenService.onionAddress, identity.networkInfo.peerId.id)
    )
    store.dispatch(
      connectionActions.setLongLivedInvite({
        seed: '5ah8uYodiwuwVybT',
        salt: '5ah8uYodiwuwVybT',
        id: '5ah8uYodiwuwVybT' as Base58,
      })
    )
    const longLivedInvite = connectionSelectors.longLivedInvite(store.getState())
    expect(longLivedInvite).toEqual({ seed: '5ah8uYodiwuwVybT', salt: '5ah8uYodiwuwVybT', id: '5ah8uYodiwuwVybT' })
    const selectorInvitationUrl = connectionSelectors.invitationUrl(store.getState())
    const authData = {
      seed: '5ah8uYodiwuwVybT',
      salt: '5ah8uYodiwuwVybT',
      communityName: communitiesSelectors.currentCommunity(store.getState())!.name!,
    }

    const pairs: InvitationPair[] = [
      {
        peerId: identity.networkInfo.peerId.id,
        onionAddress: identity.networkInfo.hiddenService.onionAddress.split('.')[0],
      },
    ]
    expect(pairs).toHaveLength(1)
    const expectedUrl = composeInvitationShareUrl({
      pairs,
      psk,
      authData,
      version: InvitationDataVersion.v2,
    })
    expect(expectedUrl).not.toEqual('')
    expect(selectorInvitationUrl).toEqual(expectedUrl)
  })

  it('invitationUrl selector returns proper v3 url when community and long lived invite are defined and qss is enabled', async () => {
    const store = prepareStore().store
    const factory = await getReduxStoreFactory(store)

    const psk = '12345'
    const ownerOrbitDbIdentity = 'testOwnerOrbitDbIdentity'
    const teamId = '7JLX5PGtsFtGtqfY2co5U8Lq5hTA3'
    const qssEndpoint = 'ws://localhost:3000'
    await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community', {
      psk,
      ownerOrbitDbIdentity,
      teamId,
      qssEnabled: true,
      qssEndpoint,
    })
    const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      communityId: communitiesSelectors.currentCommunity(store.getState())!.id,
    })
    expect(identitySelectors.currentPeerAddress(store.getState())).toEqual(
      createLibp2pAddress(identity.networkInfo.hiddenService.onionAddress, identity.networkInfo.peerId.id)
    )
    store.dispatch(
      connectionActions.setLongLivedInvite({
        seed: '5ah8uYodiwuwVybT',
        salt: '5ah8uYodiwuwVybT',
        id: '5ah8uYodiwuwVybT' as Base58,
      })
    )
    const longLivedInvite = connectionSelectors.longLivedInvite(store.getState())
    expect(longLivedInvite).toEqual({ seed: '5ah8uYodiwuwVybT', salt: '5ah8uYodiwuwVybT', id: '5ah8uYodiwuwVybT' })
    const selectorInvitationUrl = connectionSelectors.invitationUrl(store.getState())
    const authData = {
      seed: '5ah8uYodiwuwVybT',
      salt: '5ah8uYodiwuwVybT',
      communityName: communitiesSelectors.currentCommunity(store.getState())!.name!,
      teamId,
    }
    const pairs: InvitationPair[] = [
      {
        peerId: identity.networkInfo.peerId.id,
        onionAddress: identity.networkInfo.hiddenService.onionAddress.split('.')[0],
      },
    ]
    expect(pairs).toHaveLength(1)
    const expectedUrl = composeInvitationShareUrl({
      pairs,
      psk,
      authData,
      qssEnabled: true,
      qssEndpoint,
      version: InvitationDataVersion.v3,
    })
    expect(expectedUrl).not.toEqual('')
    expect(selectorInvitationUrl).toEqual(expectedUrl)
  })

  it('invitationUrl selector throws when qss is enabled but no team ID is provided', async () => {
    const store = prepareStore().store
    const factory = await getReduxStoreFactory(store)

    const peerList = [
      createLibp2pAddress(
        'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad',
        '12D3KooWCXzUw71ovvkDky6XkV57aCWUV9JhJoKhoqXa1gdhFNoL'
      ),
    ]
    const psk = '12345'
    const ownerOrbitDbIdentity = 'testOwnerOrbitDbIdentity'
    const qssEndpoint = 'ws://localhost:3000'
    await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community', {
      peerList,
      psk,
      ownerOrbitDbIdentity,
      qssEnabled: true,
      qssEndpoint,
    })
    store.dispatch(
      connectionActions.setLongLivedInvite({
        seed: '5ah8uYodiwuwVybT',
        salt: '5ah8uYodiwuwVybT',
        id: '5ah8uYodiwuwVybT' as Base58,
      })
    )
    const longLivedInvite = connectionSelectors.longLivedInvite(store.getState())
    expect(longLivedInvite).toEqual({ seed: '5ah8uYodiwuwVybT', salt: '5ah8uYodiwuwVybT', id: '5ah8uYodiwuwVybT' })
    try {
      const selectorInvitationUrl = connectionSelectors.invitationUrl(store.getState())
      expect(selectorInvitationUrl).toBe('')
    } catch (e) {
      expect(e).toBeDefined()
      expect(e.message).toBe(
        `QSS is enabled but team ID and/or QSS endpoint was null!  You must provide a team ID and QSS endpoint to properly handle QSS invites!`
      )
    }
  })

  it('invitationUrl selector throws when qss is enabled but no qss endpoint is provided', async () => {
    const store = prepareStore().store
    const factory = await getReduxStoreFactory(store)

    const peerList = [
      createLibp2pAddress(
        'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad',
        '12D3KooWCXzUw71ovvkDky6XkV57aCWUV9JhJoKhoqXa1gdhFNoL'
      ),
    ]
    const psk = '12345'
    const ownerOrbitDbIdentity = 'testOwnerOrbitDbIdentity'
    const teamId = '7JLX5PGtsFtGtqfY2co5U8Lq5hTA3'

    await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community', {
      peerList,
      psk,
      ownerOrbitDbIdentity,
      qssEnabled: true,
      teamId,
    })
    store.dispatch(
      connectionActions.setLongLivedInvite({
        seed: '5ah8uYodiwuwVybT',
        salt: '5ah8uYodiwuwVybT',
        id: '5ah8uYodiwuwVybT' as Base58,
      })
    )
    const longLivedInvite = connectionSelectors.longLivedInvite(store.getState())
    expect(longLivedInvite).toEqual({ seed: '5ah8uYodiwuwVybT', salt: '5ah8uYodiwuwVybT', id: '5ah8uYodiwuwVybT' })
    try {
      const selectorInvitationUrl = connectionSelectors.invitationUrl(store.getState())
      expect(selectorInvitationUrl).toBe('')
    } catch (e) {
      expect(e).toBeDefined()
      expect(e.message).toBe(
        `QSS is enabled but team ID and/or QSS endpoint was null!  You must provide a team ID and QSS endpoint to properly handle QSS invites!`
      )
    }
  })

  it('invitationUrl selector returns empty string if state lacks peer list', async () => {
    const store = prepareStore().store
    const factory = await getReduxStoreFactory(store)

    const peerList = [
      createLibp2pAddress(
        'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad',
        '12D3KooWCXzUw71ovvkDky6XkV57aCWUV9JhJoKhoqXa1gdhFNoL'
      ),
    ]
    const psk = '1234'
    const ownerOrbitDbIdentity = 'testOwnerOrbitDbIdentity'
    await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community', {
      // peerList, // peerList is not defined
      psk,
      ownerOrbitDbIdentity,
    })
    store.dispatch(
      connectionActions.setLongLivedInvite({
        seed: '5ah8uYodiwuwVybT',
        salt: '5ah8uYodiwuwVybT',
        id: '5ah8uYodiwuwVybT' as Base58,
      })
    )
    const selectorInvitationUrl = connectionSelectors.invitationUrl(store.getState())
    expect(selectorInvitationUrl).toEqual('')
  })

  it('invitationUrl selector returns empty string if state lacks psk', async () => {
    const store = prepareStore().store
    const factory = await getReduxStoreFactory(store)

    const peerList = [
      createLibp2pAddress(
        'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad',
        '12D3KooWCXzUw71ovvkDky6XkV57aCWUV9JhJoKhoqXa1gdhFNoL'
      ),
    ]
    const psk = '1234'
    const ownerOrbitDbIdentity = 'testOwnerOrbitDbIdentity'
    await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community', {
      peerList,
      // psk, // psk is not defined
      ownerOrbitDbIdentity,
    })
    store.dispatch(
      connectionActions.setLongLivedInvite({
        seed: '5ah8uYodiwuwVybT',
        salt: '5ah8uYodiwuwVybT',
        id: '5ah8uYodiwuwVybT' as Base58,
      })
    )
    const selectorInvitationUrl = connectionSelectors.invitationUrl(store.getState())
    expect(selectorInvitationUrl).toEqual('')
  })

  it('invitationUrl selector returns empty string if state lacks lfa invite seed', async () => {
    const store = prepareStore().store
    const factory = await getReduxStoreFactory(store)

    const peerList = [
      createLibp2pAddress(
        'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad',
        '12D3KooWCXzUw71ovvkDky6XkV57aCWUV9JhJoKhoqXa1gdhFNoL'
      ),
    ]
    const psk = '1234'
    const ownerOrbitDbIdentity = 'testOwnerOrbitDbIdentity'
    await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community', {
      peerList,
      psk,
      ownerOrbitDbIdentity,
    })
    // store.dispatch(
    //   connectionActions.setLongLivedInvite({
    //     seed: '5ah8uYodiwuwVybT',
    //     id: '5ah8uYodiwuwVybT' as Base58,
    //   })
    // )
    const selectorInvitationUrl = connectionSelectors.invitationUrl(store.getState())
    expect(selectorInvitationUrl).toEqual('')
  })

  it('sets isJoiningCompleted to true only when all conditions are met', async () => {
    const store = prepareStore().store
    const factory = await getReduxStoreFactory(store)
    const baseTypesFactory = await getBaseTypesFactory()

    logger.info('Checking initial state')
    expect(connectionSelectors.isJoiningCompleted(store.getState())).toBe(false)
    expect(networkSelectors.isCurrentCommunityInitialized(store.getState())).toBe(false)
    expect(publicChannelsSelectors.areMessagesLoaded(store.getState())).toBe(false)
    expect(publicChannelsSelectors.areChannelsLoaded(store.getState())).toBe(false)

    logger.info('Creating community')
    const community = await factory.create('Community')
    // store.dispatch(communitiesActions.setCurrentCommunity(community.id))
    const identity = await factory.create('Identity', {
      communityId: community.id,
    })
    expect(connectionSelectors.isJoiningCompleted(store.getState())).toBe(false)
    expect(networkSelectors.isCurrentCommunityInitialized(store.getState())).toBe(false)
    expect(publicChannelsSelectors.areMessagesLoaded(store.getState())).toBe(false)
    expect(publicChannelsSelectors.areChannelsLoaded(store.getState())).toBe(true)

    store.dispatch(networkActions.addInitializedCommunity(community.id))
    expect(connectionSelectors.isJoiningCompleted(store.getState())).toBe(false)
    expect(networkSelectors.isCurrentCommunityInitialized(store.getState())).toBe(true)
    expect(publicChannelsSelectors.areMessagesLoaded(store.getState())).toBe(false)
    expect(publicChannelsSelectors.areChannelsLoaded(store.getState())).toBe(true)

    store.dispatch(connectionActions.setTorInitialized())
    expect(connectionSelectors.isJoiningCompleted(store.getState())).toBe(false)
    expect(networkSelectors.isCurrentCommunityInitialized(store.getState())).toBe(true)
    expect(publicChannelsSelectors.areMessagesLoaded(store.getState())).toBe(false)
    expect(publicChannelsSelectors.areChannelsLoaded(store.getState())).toBe(true)

    const message = await factory.create('TestMessage', {
      message: baseTypesFactory.build('ChannelMessage', {
        channelId: publicChannelsSelectors.generalChannel(store.getState())?.id,
        userId: identity.userId,
      }),
    })
    expect(connectionSelectors.isJoiningCompleted(store.getState())).toBe(true)
    expect(networkSelectors.isCurrentCommunityInitialized(store.getState())).toBe(true)
    expect(publicChannelsSelectors.areMessagesLoaded(store.getState())).toBe(true)
    expect(publicChannelsSelectors.areChannelsLoaded(store.getState())).toBe(true)
  })
})
