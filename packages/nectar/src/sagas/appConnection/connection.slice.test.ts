import { combineReducers, createStore, Store } from 'redux'
import { StoreKeys } from '../store.keys'
import { connectionSelectors } from './connection.selectors'

import {
  connectionActions,
  connectionReducer,
  ConnectionState
} from './connection.slice'

describe('connectionReducer', () => {
  let store: Store

  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.Connection]: connectionReducer
      }),
      {
        [StoreKeys.Connection]: {
          ...new ConnectionState()
        }
      }
    )
  })

  it('add initialized communities should add correctly data into the store', () => {
    const communityId = 'communityId'
    store.dispatch(connectionActions.addInitializedCommunity(communityId))

    const communities = connectionSelectors.initializedCommunities(
      store.getState()
    )
    expect(communities).toEqual({ [communityId]: true })
  })

  it('add initialized registrar should add correctly data into the store', () => {
    const registrarId = 'registrarId'
    store.dispatch(connectionActions.addInitializedRegistrar(registrarId))

    const registrars = connectionSelectors.initializedRegistrars(
      store.getState()
    )
    expect(registrars).toEqual({ [registrarId]: true })
  })

  it('add/remove connected peerId from store and get it correctly', () => {
    const connectedPeers = new Set<string>()
    connectedPeers.add('peerId1')
    connectedPeers.add('peerId2')
    let connectedPeersArray
    const peersIds = {
      connectedPeers: connectedPeers,
      newPeer: 'peerId3'
    }

    store.dispatch(connectionActions.addConnectedPeers(peersIds))
    connectedPeersArray = connectionSelectors.connectedPeers(
      store.getState()
    )
    expect(connectedPeersArray).toEqual(['peerId1', 'peerId2', 'peerId3'])

    store.dispatch(connectionActions.removeConnectedPeers(peersIds))
    connectedPeersArray = connectionSelectors.connectedPeers(
      store.getState()
    )
    expect(connectedPeersArray).toEqual(['peerId1', 'peerId2'])
  })
})
