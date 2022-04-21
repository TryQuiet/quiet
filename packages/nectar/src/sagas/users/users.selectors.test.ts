import { combineReducers, createStore, Store } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'

import {
  communitiesReducer,
  CommunitiesState,
  Community
} from '../communities/communities.slice'

import { usersReducer, UsersState } from '../users/users.slice'

import { communitiesAdapter } from '../communities/communities.adapter'
import { certificatesAdapter } from '../users/users.adapter'
import { keyFromCertificate, parseCertificate, userData } from '@quiet/identity'
import { usersSelectors } from './users.selectors'

describe('users selectors', () => {
  let store: Store

  const quietcommunity: Community = {
    name: 'quietcommunity',
    id: 'quietcommunity',
    CA: {
      rootCertString:
        'MIIBaTCCAQ6gAwIBAgIBATAKBggqhkjOPQQDAjAZMRcwFQYDVgUGEw5xdWlldGNvbW11bml0eTAmGBMyMDIyMDQyMTEyMzg1NC4xMTRaGA8yMDMwMDEzMTIzMDAwMFowGTEXMBUGA1YFBhMOcXVpZXRjb21tdW5pdHkwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQLu8hLJE9vnGbRZShpIx0x9ABJlIVkyZC9rc++xEroETVw5Z/4kJQRb/fKjFd9iJ8/deddNuXZ7gjpIqtCRzctoz8wPTAPBgNVHRMECDAGAQH/AgEDMAsGA1UdDwQEAwIAhjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwCgYIKoZIzj0EAwIDSQAwRgIhAIjX4oDd0NUXSSkZKOVR59NCh71nskJtw71uT5Xhicg6AiEA9GlTJhPf02BSMWQQKWIbdtzJnvJCh6OIs5/v1hht4pE=',
      rootKeyString:
        'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg8yTXKF64TP9vfET36k/6QGq29eWMVCxM8Kzt8GdLQUugCgYIKoZIzj0DAQehRANCAASJ8Z5j0pQf4Ht4kkmsqD0SDdnZaALAZ/PFmt+5llK4hW2L5K5ckfq/mlVe6c/8hUNQxRYl1e3U1kcTD7JUr+cB'
    },
    rootCa: '',
    peerList: [],
    registrarUrl: '',
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0
  }

  const userCertData = {
    username: 'userName',
    onionAddress: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
    peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
    dmPublicKey: '0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9',
  }

  const userCertString =
    'MIICGzCCAcGgAwIBAgIGAYBMHa+UMAoGCCqGSM49BAMCMBkxFzAVBgNWBQYTDnF1aWV0Y29tbXVuaXR5MB4XDTIyMDQyMTEyMzQxNVoXDTMwMDEzMTIzMDAwMFowSTFHMEUGA1YFBhM+bnFudzRrYzRjNzdmYjQ3bGs1Mm01bDU3aDR0Y3hjZW83eW14ZWtmbjd5aDVtNjZ0NGp2Mm9sYWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQFSjLDbJPOY57bC2wfR+l3AR1cg9clsmBydNrYY5SuYdHdB7EHJnxZ18nqTuw2FBCwSWJUDAgBDEUYyds5irJoo4HEMIHBMAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCAMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAvBgkqhkiG9w0BCQwEIgQgC/tHWBDA4myfq1kNR8PWDsUzuzxFFZasw81PIWAumtkwGAYKKwYBBAGDjBsCAQQKEwh1c2VyTmFtZTA9BgkrBgECAQ8DAQEEMBMuUW1mM3lTa1lxTEVUOXh0QXREenZBcjVQcDNlZ0sxSDNDNWlKQVptMVNwTEVwNjAKBggqhkjOPQQDAgNIADBFAiEAgLM086fL6ahCxlQIhXRn0MwXmo5KWEqy86QnhLDoA7MCIANbCeioJlk9RH9wOMjXEA+MKs0nfSnQzO1X86wv6E2y'
  const parsedCert = parseCertificate(userCertString)
  const userPubKey = keyFromCertificate(parsedCert)

  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.Communities]: communitiesReducer,
        [StoreKeys.Users]: usersReducer
      }),
      {
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'communityId',
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [quietcommunity]
          )
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

  it('get proper user certificate from store', async () => {
    const certificates = usersSelectors.certificates(store.getState())
    const userCertificate = certificates[userPubKey] || null

    expect(userCertificate).not.toBeNull()
  })

  it('get proper fields from user certificate', async () => {
    const usersData = usersSelectors.certificatesMapping(store.getState())

    expect(usersData[userPubKey]).toEqual(userCertData)

    expect(usersData[userPubKey]).toMatchInlineSnapshot(`
      Object {
        "dmPublicKey": "0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9",
        "onionAddress": "nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion",
        "peerId": "Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6",
        "username": "userName",
      }
    `)
  })
})

export { }
