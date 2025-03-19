import { Store } from '@reduxjs/toolkit'
import { prepareStore } from '../../utils/tests/prepareStore'

import { FactoryGirl } from 'factory-girl'
import { getFactory } from '../../utils/tests/factories'

import { keyFromCertificate, parseCertificate, parseCertificationRequest } from '@quiet/identity'
import { Identity, Community } from '@quiet/types'

import { communitiesActions } from '../communities/communities.slice'

import { identityActions } from '../identity/identity.slice'

import { usersSelectors } from './users.selectors'

describe('users selectors', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community

  let alice: Identity
  let alicePublicKey: string

  const aliceCertificateData = {
    onionAddress: 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
    peerId: '12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN3qY',
    username: 'alice',
  }

  let aliceUnregistered: Identity
  let aliceUnregisteredPublicKey: string

  beforeAll(async () => {
    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      communityId: community.id,
    })

    aliceUnregistered = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      communityId: community.id,
      nickname: aliceCertificateData.username,
      userId: '',
    })
  })

  it("gets registered user with proper 'isRegistered' prop", async () => {
    const users = usersSelectors.allUsers(store.getState())

    expect(users[alice.userId!]).toMatchObject({
      isRegistered: true,
    })
  })

  // it("gets unregistered user with proper 'isRegistered' prop", async () => {
  //   const users = usersSelectors.allUsers(store.getState())

  //   expect(users[aliceUnregisteredPublicKey]).toMatchObject({
  //     isRegistered: false,
  //   })
  // })

  // it("gets all users (registered users don't get 'duplicate' label over unregistered ones)", async () => {
  //   const users = usersSelectors.allUsers(store.getState())

  //   expect(users[alicePublicKey]).toMatchObject({
  //     isDuplicated: false,
  //     isRegistered: true,
  //   })

  //   expect(users[aliceUnregisteredPublicKey]).toMatchObject({
  //     isDuplicated: true,
  //     isRegistered: false,
  //   })
  // })
})

export {}
