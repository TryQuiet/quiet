import { Store } from '@reduxjs/toolkit'
import { prepareStore } from '../../utils/tests/prepareStore'

import { FactoryGirl } from 'factory-girl'
import { getFactory } from '../../utils/tests/factories'

import { keyFromCertificate, parseCertificate } from '@quiet/identity'
import { Identity, Community } from '@quiet/types'

import { communitiesActions, communitiesReducer, CommunitiesState } from '../communities/communities.slice'

import { identityActions } from '../identity/identity.slice'

import { usersSelectors } from './users.selectors'

describe('users selectors', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community

  let alice: Identity
  let alicePublicKey: string

  const aliceCertificateData = {
    dmPublicKey: '0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9',
    onionAddress: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
    peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
    username: 'alice',
  }

  beforeAll(async () => {
    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: aliceCertificateData.username,
      hiddenService: {
        onionAddress: aliceCertificateData.onionAddress,
        privateKey: '',
      },
      peerId: { 
        id: aliceCertificateData.peerId
      },
      dmKeys: {
        publicKey: aliceCertificateData.dmPublicKey,
        privateKey: ''
      }
    })

    const parsedAliceCertificate = parseCertificate(alice.userCertificate!)
    alicePublicKey = keyFromCertificate(parsedAliceCertificate)
  })

  it('get proper user certificate from store', async () => {
    const certificates = usersSelectors.certificates(store.getState())
    const userCertificate = certificates[alicePublicKey] || null

    expect(userCertificate).not.toBeNull()
  })

  it('get proper fields from user certificate', async () => {
    const usersData = usersSelectors.certificatesMapping(store.getState())

    expect(usersData[alicePublicKey]).toEqual(aliceCertificateData)

    expect(usersData[alicePublicKey]).toMatchInlineSnapshot(`
      Object {
        "dmPublicKey": "0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9",
        "onionAddress": "nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion",
        "peerId": "Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6",
        "username": "alice",
      }
    `)
  })
})

export {}
