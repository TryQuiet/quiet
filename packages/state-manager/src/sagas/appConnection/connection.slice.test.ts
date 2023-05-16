import { Store } from 'redux'
import { connectionSelectors } from './connection.selectors'
import { connectionActions } from './connection.slice'
import { identityActions } from '../identity/identity.slice'
import { prepareStore } from '../../utils/tests/prepareStore'
import { getFactory } from '../../utils/tests/factories'
import { setupCrypto } from '@quiet/identity'
import { networkActions } from '../network/network.slice'
import { networkSelectors } from '../network/network.selectors'
import { Identity } from '@quiet/types'

describe('connectionReducer', () => {
  let store: Store
  let alice: Identity

  beforeEach(async () => {
    setupCrypto()

    store = prepareStore().store

    const factory = await getFactory(store)

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { nickname: 'alice' }
    )
  })

  it('add initialized communities should add correctly data into the store', () => {
    const communityId = 'communityId'
    store.dispatch(networkActions.addInitializedCommunity(communityId))

    const communities = networkSelectors.initializedCommunities(store.getState())
    expect(communities).toEqual({ [communityId]: true })
  })

  it('add initialized registrar should add correctly data into the store', () => {
    const registrarId = 'registrarId'
    store.dispatch(networkActions.addInitializedRegistrar(registrarId))

    const registrars = networkSelectors.initializedRegistrars(store.getState())
    expect(registrars).toEqual({ [registrarId]: true })
  })

  it('add connected users peerId from store and get it correctly', () => {
    const peersIds = ['peerId1', 'peerId2']

    store.dispatch(networkActions.addConnectedPeers(peersIds))

    const connectedPeersFromStore = networkSelectors.connectedPeers(store.getState())

    expect(connectedPeersFromStore).toEqual(['peerId1', 'peerId2'])
  })

  it('user data mapping by peerId', () => {
    const aliceCertData = {
      username: alice.nickname,
      onionAddress: alice.hiddenService.onionAddress,
      peerId: alice.peerId.id,
      dmPublicKey: ''
    }

    store.dispatch(networkActions.addConnectedPeers([alice.peerId.id]))
    const userDataPerPeerId = connectionSelectors.connectedPeersMapping(store.getState())

    expect(userDataPerPeerId[alice.peerId.id]).toEqual(aliceCertData)
  })

  it('setTorBootstrapProcess', () => {
    const payload =
      'Mar 29 15:15:38.000 [notice] Bootstrapped 10% (conn_done): Connected to a relay'

    store.dispatch(connectionActions.setTorBootstrapProcess(payload))

    const torBootstrapInfo = connectionSelectors.torBootstrapProcess(store.getState())

    const expectedTorBootstrapInfo = 'Bootstrapped 10% (conn_done)'

    expect(torBootstrapInfo).toEqual(expectedTorBootstrapInfo)
  })

  it('setTorConnectionProcess', () => {
    const payload1 = 'Initializing storage'

    store.dispatch(connectionActions.setTorConnectionProcess(payload1))

    const payload2 = 'Initializing IPFS'

    store.dispatch(connectionActions.setTorConnectionProcess(payload2))

    const { number, text } = connectionSelectors.torConnectionProcess(store.getState())

    expect(number).toEqual(65)

    expect(text).toEqual(payload2)
  })
})
