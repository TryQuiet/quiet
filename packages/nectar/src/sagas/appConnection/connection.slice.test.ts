import { Store } from 'redux'
import { connectionSelectors } from './connection.selectors'

import { connectionActions } from './connection.slice'

import { identityActions } from '../identity/identity.slice'
import { prepareStore } from '../../utils/tests/prepareStore'
import { getFactory } from '../../utils/tests/factories'
import { setupCrypto } from '@quiet/identity'
import { Identity } from '../identity/identity.types'

describe('connectionReducer', () => {
  let store: Store
  let alice: Identity

  beforeEach(async () => {
    setupCrypto()

    store = prepareStore().store

    const factory = await getFactory(store)

    alice = await factory.create<
    ReturnType<typeof identityActions.addNewIdentity>['payload']
    >('Identity', { zbayNickname: 'alice' })
  })

  it('add initialized communities should add correctly data into the store', () => {
    const communityId = 'communityId'
    store.dispatch(connectionActions.addInitializedCommunity(communityId))

    const communities = connectionSelectors.initializedCommunities(store.getState())
    expect(communities).toEqual({ [communityId]: true })
  })

  it('add initialized registrar should add correctly data into the store', () => {
    const registrarId = 'registrarId'
    store.dispatch(connectionActions.addInitializedRegistrar(registrarId))

    const registrars = connectionSelectors.initializedRegistrars(store.getState())
    expect(registrars).toEqual({ [registrarId]: true })
  })

  it('add connected users peerId from store and get it correctly', () => {
    const peersIds = ['peerId1', 'peerId2']

    store.dispatch(connectionActions.addConnectedPeers(peersIds))
    const connectedPeersFromStore = connectionSelectors.connectedPeers(store.getState())

    expect(connectedPeersFromStore).toEqual(['peerId1', 'peerId2'])
  })

  it('user data mapping by peerId', () => {
    const aliceCertData = {
      username: alice.zbayNickname,
      onionAddress: alice.hiddenService.onionAddress,
      peerId: alice.peerId.id,
      dmPublicKey: ''
    }

    store.dispatch(connectionActions.addConnectedPeers([alice.peerId.id]))
    const userDataPerPeerId = connectionSelectors.connectedPeersMapping(store.getState())

    expect(userDataPerPeerId[alice.peerId.id]).toEqual(aliceCertData)
  })
})
