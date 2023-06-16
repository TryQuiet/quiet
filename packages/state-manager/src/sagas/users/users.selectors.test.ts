import { combineReducers, createStore, type Store } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'

import {
  communitiesReducer,
  CommunitiesState
} from '../communities/communities.slice'

import { usersReducer, UsersState } from '../users/users.slice'

import { communitiesAdapter } from '../communities/communities.adapter'
import { certificatesAdapter } from '../users/users.adapter'
import { keyFromCertificate, parseCertificate } from '@quiet/identity'
import { usersSelectors } from './users.selectors'
import { type Community } from '@quiet/types'

describe('users selectors', () => {
  let store: Store

  const quietcommunity: Community = { // TODO CHECK
    name: 'quietcommunity',
    id: 'quietcommunity',
    CA: {
      rootCertString:
        'MIIBYDCCAQagAwIBAgIBATAKBggqhkjOPQQDAjAZMRcwFQYDVQQDEw5xdWlldGNvbW11bml0eTAeFw0xMDEyMjgxMDEwMTBaFw0zMDEyMjgxMDEwMTBaMBkxFzAVBgNVBAMTDnF1aWV0Y29tbXVuaXR5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAER8nj5zrEqEvjOZe1hIGx7fwXXNF2AwklSh7zBNnZSZpQfAdyeBTCF76OMQoSroZKmHkOw6EtvLhDmDA31lnFfaM/MD0wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAIYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAoGCCqGSM49BAMCA0gAMEUCIQCLh+vUNv1Czj6N+QGe1wXH/EK1EDpv7FhNQ7KoJLPUPgIgbkZZccoEQYIiK6fgdofZ1OIPWGQcazY6yfcUpGop8PQ=',
      rootKeyString:
        'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgzwEMy6znlS1amoN8tcrNUXTO7WGTagioyI5XwKj8mdygCgYIKoZIzj0DAQehRANCAARHyePnOsSoS+M5l7WEgbHt/Bdc0XYDCSVKHvME2dlJmlB8B3J4FMIXvo4xChKuhkqYeQ7DoS28uEOYMDfWWcV9'
    },
    rootCa: ''
  }

  const userCertData = {
    username: 'userName',
    onionAddress: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
    peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
    dmPublicKey: '0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9'
  }

  const userCertString =
    'MIICaDCCAg6gAwIBAgIGAYBqyuV2MAoGCCqGSM49BAMCMBkxFzAVBgNVBAMTDnF1aWV0Y29tbXVuaXR5MB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowSTFHMEUGA1UEAxM+bnFudzRrYzRjNzdmYjQ3bGs1Mm01bDU3aDR0Y3hjZW83eW14ZWtmbjd5aDVtNjZ0NGp2Mm9sYWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQZBMmiVmRBRvw+QiL5DYg7WGFUVgA7u90KMpJg4qCaCJJNh7wH2tl0EDsN4FeGmR9AkvtCGd+5vYL0nGcX/oLdo4IBEDCCAQwwCQYDVR0TBAIwADALBgNVHQ8EBAMCAIAwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMC8GCSqGSIb3DQEJDAQiBCAL+0dYEMDibJ+rWQ1Hw9YOxTO7PEUVlqzDzU8hYC6a2TAYBgorBgEEAYOMGwIBBAoTCHVzZXJOYW1lMD0GCSsGAQIBDwMBAQQwEy5RbWYzeVNrWXFMRVQ5eHRBdER6dkFyNVBwM2VnSzFIM0M1aUpBWm0xU3BMRXA2MEkGA1UdEQRCMECCPm5xbnc0a2M0Yzc3ZmI0N2xrNTJtNWw1N2g0dGN4Y2VvN3lteGVrZm43eWg1bTY2dDRqdjJvbGFkLm9uaW9uMAoGCCqGSM49BAMCA0gAMEUCIF63rnIq8vd86NT9RHSFj7borwwODqyfE7Pw64tGElpIAiEA5ZDSdrDd8OGf+kv7wxByM1Xgmc5m/aydUk+WorbO3Gg='
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
