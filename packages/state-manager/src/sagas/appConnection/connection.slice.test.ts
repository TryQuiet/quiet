import { type Store } from 'redux'

import { connectionSelectors } from './connection.selectors'
import { connectionActions } from './connection.slice'
import { prepareStore } from '../../utils/tests/prepareStore'
import { setupCrypto } from '@quiet/identity'
import { networkActions } from '../network/network.slice'
import { networkSelectors } from '../network/network.selectors'
import {
  Community,
  ConnectionProcessInfo,
  type LinkedDevice,
  PublicChannel,
  type Identity,
  ChannelMessage,
} from '@quiet/types'
import { publicChannelsSelectors } from '../publicChannels/publicChannels.selectors'
import { getReduxStoreFactory } from '../../utils/tests/factories'
import { createLogger } from '../../utils/logger'
import { communitiesActions } from '../communities/communities.slice'
import { FactoryGirl } from 'factory-girl'

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

  it('clears a previous device-link generation failure when retrying', () => {
    store.dispatch(connectionActions.setDeviceLinkCreationFailed(true))
    expect(connectionSelectors.deviceLinkCreationFailed(store.getState())).toBe(true)

    store.dispatch(connectionActions.createDeviceLink())

    expect(connectionSelectors.deviceLinkCreationFailed(store.getState())).toBe(false)
  })

  it('tells an unread device list apart from an empty one', () => {
    // A surface that cannot tell these apart says "No linked devices" before the
    // answer arrives, and would say it just as confidently with the read severed.
    expect(connectionSelectors.linkedDevices(store.getState())).toBeUndefined()

    store.dispatch(connectionActions.setLinkedDevices([]))

    expect(connectionSelectors.linkedDevices(store.getState())).toEqual([])
  })

  it('forgets the device list when the current community changes', () => {
    const devices: LinkedDevice[] = [
      { deviceId: 'this', deviceName: 'this-device', isCurrent: true },
      { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
    ]
    store.dispatch(connectionActions.setLinkedDevices(devices))
    expect(connectionSelectors.linkedDevices(store.getState())).toEqual(devices)

    // The rows belong to one community's team graph; under another community they
    // would be someone else's devices, so they go back to "not read yet".
    store.dispatch(communitiesActions.setCurrentCommunity('another-community'))

    expect(connectionSelectors.linkedDevices(store.getState())).toBeUndefined()
  })

  it('forgets the device list when the community is deleted', () => {
    store.dispatch(connectionActions.setLinkedDevices([{ deviceId: 'laptop', deviceName: 'l', isCurrent: false }]))

    store.dispatch(communitiesActions.deleteCommunity(community.id))

    expect(connectionSelectors.linkedDevices(store.getState())).toBeUndefined()
  })
})
