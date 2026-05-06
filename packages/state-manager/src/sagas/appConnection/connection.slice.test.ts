import { type Store } from 'redux'

import { connectionSelectors } from './connection.selectors'
import { connectionActions } from './connection.slice'
import { prepareStore, testReducers } from '../../utils/tests/prepareStore'
import { setupCrypto } from '@quiet/identity'
import { networkActions } from '../network/network.slice'
import { networkSelectors } from '../network/network.selectors'
import { Community, ConnectionProcessInfo, PublicChannel, type Identity, ChannelMessage } from '@quiet/types'
import { publicChannelsSelectors } from '../publicChannels/publicChannels.selectors'
import { getBaseTypesFactory, getReduxStoreFactory } from '../../utils/tests/factories'
import { createLogger } from '../../utils/logger'
import { communitiesActions } from '../communities/communities.slice'
import { isOwner } from '../communities/communities.selectors'
import factory, { FactoryGirl } from 'factory-girl'
import { connect } from 'socket.io-client'

describe('connectionReducer', () => {
  let store: Store
  let factory: FactoryGirl
  let alice: Identity
  let community: Community
  let generalChannel: PublicChannel
  let generalChannelId: string

  beforeEach(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)

    alice = await factory.create('Identity')

    // Do not use `factory.create` here, because it will create a general channel
    community = await factory.build('Community')
    store.dispatch(communitiesActions.addNewCommunity(community))

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    generalChannelId = generalChannel?.id || ''
  })

  it('add connected users peerId from store and get it correctly', () => {
    const logger = createLogger('connection.slice.test2')
    logger.info('add connected users peerId from store and get it correctly')
    const peersIds = ['peerId1', 'peerId2']

    store.dispatch(networkActions.addConnectedPeers(peersIds))

    const connectedPeersFromStore = networkSelectors.connectedPeers(store.getState())

    expect(connectedPeersFromStore).toEqual(['peerId1', 'peerId2'])
  })

  it('set connectionProcess', async () => {
    const logger = createLogger('connection.slice.test3')
    logger.info('set connectionProcess')

    const connectionProcess = await factory.create('setConnectionProcess', {
      info: ConnectionProcessInfo.INITIALIZING_IPFS,
    })

    const { number, text } = connectionSelectors.connectionProcess(store.getState())

    expect(number).toEqual(30)

    expect(text).toEqual(ConnectionProcessInfo.BACKEND_MODULES)
  })
})
