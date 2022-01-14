import { combineReducers, createStore, Store } from 'redux'
import { StoreKeys } from '../store.keys'
import { connectionSelectors } from './connection.selectors'
import { parseCertificate } from '@zbayapp/identity'
import { certificatesAdapter } from '../users/users.adapter'

import {
  connectionActions,
  connectionReducer,
  ConnectionState
} from './connection.slice'
import { usersReducer, UsersState } from '../users/users.slice'


const userCertData = {
  username: 'userName',
  onionAddress:
    'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
  peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
  dmPublicKey:
    '0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9'
}

const userCertString =
  'MIICDzCCAbUCBgF9Ms+EwTAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMTExODExMzAwMFoXDTMwMDEzMTIzMDAwMFowSTFHMEUGA1UEAxM+bnFudzRrYzRjNzdmYjQ3bGs1Mm01bDU3aDR0Y3hjZW83eW14ZWtmbjd5aDVtNjZ0NGp2Mm9sYWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAT3mQI3akfoTD3i94ZJZMmZ2RZswEeQ0aW0og+/VuzUJQblVQ+UdH6kuKFjq7BTtdjYTMSCO9wfPotBX88+p2Kuo4HEMIHBMAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCOMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAvBgkqhkiG9w0BCQwEIgQgC/tHWBDA4myfq1kNR8PWDsUzuzxFFZasw81PIWAumtkwGAYKKwYBBAGDjBsCAQQKEwh1c2VyTmFtZTA9BgkrBgECAQ8DAQEEMBMuUW1mM3lTa1lxTEVUOXh0QXREenZBcjVQcDNlZ0sxSDNDNWlKQVptMVNwTEVwNjAKBggqhkjOPQQDAgNIADBFAiBYmTIJtW2pARg4WTIVMXs2fvGroBxko71CnUi3Fum1WQIhAM0npNOL0/2+8dRTWRNE61D4jcbtltmXAXFjYbd711hk'

const parsedCert = parseCertificate(userCertString)

describe('connectionReducer', () => {
  let store: Store

  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.Connection]: connectionReducer,
        [StoreKeys.Users]: usersReducer
      }),
      {
        [StoreKeys.Connection]: {
          ...new ConnectionState()
        },
        [StoreKeys.Users]: {
          ...new UsersState(),
          certificates: certificatesAdapter.setAll(
            certificatesAdapter.getInitialState(),
            [parsedCert]
          )
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
    let connectedPeersFromStore
    const peersIds = {
      connectedPeers: ['peerId1', 'peerId2'],
      newPeer: 'peerId3'
    }

    store.dispatch(connectionActions.addConnectedPeers(peersIds))
    connectedPeersFromStore = connectionSelectors.connectedPeers(
      store.getState()
    )
    expect(connectedPeersFromStore).toEqual(['peerId1', 'peerId2', 'peerId3'])

    store.dispatch(connectionActions.removeConnectedPeers(peersIds))
    connectedPeersFromStore = connectionSelectors.connectedPeers(
      store.getState()
    )
    expect(connectedPeersFromStore).toEqual(['peerId1', 'peerId2'])
  })

  it('user data mapping by peerId', () => {
    const peersIds = {
      connectedPeers: [],
      newPeer: userCertData.peerId
    }

    store.dispatch(connectionActions.addConnectedPeers(peersIds))
    const userDataPerPeerId = connectionSelectors.connectedPeersMapping(
      store.getState()
    )

    expect(userDataPerPeerId[peersIds.newPeer]).toEqual(userCertData)
  })
})
