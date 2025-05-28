import { type communitiesActions } from './../communities/communities.slice'
import { identitySelectors } from './identity.selectors'
import { type identityActions } from './identity.slice'
import { type Store } from '../store.types'
import { type FactoryGirl } from 'factory-girl'
import { setupCrypto } from '@quiet/identity'
import { prepareStore, testReducers } from '../../utils/tests/prepareStore'
import { getReduxStoreFactory } from '../../utils/tests/factories'

describe('communitiesSelectors will receive correct data', () => {
  let store: Store
  let factory: FactoryGirl

  beforeAll(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)
  })

  it('select current identity', async () => {
    const communityAlpha = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>(
      'Community',
      { name: 'alpha', id: 'communityAlpha' }
    )

    const identity = await factory.create('Identity', {
      communityId: communityAlpha.id,
      nickname: 'john',
    })

    const communityBeta = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>(
      'Community',
      { name: 'beta', id: 'communityBeta' }
    )

    const currentIdentity = identitySelectors.currentIdentity(store.getState())

    expect(currentIdentity?.communityId).toEqual(communityAlpha.id)
  })
})
