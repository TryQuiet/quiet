import { type Store } from 'redux'
import { connectionSelectors } from './connection.selectors'
import { connectionActions } from './connection.slice'
import { type identityActions } from '../identity/identity.slice'
import { prepareStore } from '../../utils/tests/prepareStore'
import { getFactory } from '../../utils/tests/factories'
import { setupCrypto } from '@quiet/identity'
import { networkActions } from '../network/network.slice'
import { networkSelectors } from '../network/network.selectors'
import { type Identity } from '@quiet/types'
import { usersSelectors } from '../users/users.selectors'

describe('connectionReducer', () => {
  let store: Store
  let alice: Identity

  beforeEach(async () => {
    setupCrypto()

    store = prepareStore().store

    const factory = await getFactory(store)

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      nickname: 'alice',
    })
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
    const allUsers = usersSelectors.allUsers(store.getState())
    const _pubKey = Object.values(allUsers).map(item => {
      if (item.username === 'alice') {
        return item.pubKey
      }
    })
    const pubKey = _pubKey[0]
    const aliceCertData = {
      username: alice.nickname,
      onionAddress: alice.hiddenService.onionAddress,
      peerId: alice.peerId.id,
      dmPublicKey: alice.dmKeys.publicKey,
      isDuplicated: false,
      isRegistered: true,
      pubKey,
    }

    store.dispatch(networkActions.addConnectedPeers([alice.peerId.id]))
    const userDataPerPeerId = connectionSelectors.connectedPeersMapping(store.getState())
    expect(userDataPerPeerId[alice.peerId.id]).toEqual(aliceCertData)
  })

  it('setTorBootstrapProcess', () => {
    const payload = 'Mar 29 15:15:38.000 [notice] Bootstrapped 10% (conn_done): Connected to a relay'

    store.dispatch(connectionActions.setTorBootstrapProcess(payload))

    const torBootstrapInfo = connectionSelectors.torBootstrapProcess(store.getState())

    const expectedTorBootstrapInfo = 'Bootstrapped 10% (conn_done)'

    expect(torBootstrapInfo).toEqual(expectedTorBootstrapInfo)
  })

  it('set connectionProcess', () => {
    const payload2 = 'Initializing IPFS'

    store.dispatch(connectionActions.setConnectionProcess(payload2))

    const { number, text } = connectionSelectors.connectionProcess(store.getState())

    expect(number).toEqual(30)

    expect(text).toEqual('Initialized backend modules')
  })
})
