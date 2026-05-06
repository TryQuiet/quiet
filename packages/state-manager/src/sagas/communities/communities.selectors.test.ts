import { setupCrypto } from '@quiet/identity'
import { type Store } from '@reduxjs/toolkit'
import { getReduxStoreFactory } from '../../utils/tests/factories'
import { prepareStore, testReducers } from '../../utils/tests/prepareStore'
import { type identityActions } from '../identity/identity.slice'
import { communitiesSelectors } from './communities.selectors'
import { communitiesActions } from './communities.slice'
import { type Community, type Identity } from '@quiet/types'

describe('communitiesSelectors', () => {
  setupCrypto()

  let store: Store
  let communityAlpha: Community
  let communityBeta: Community
  let identity: Identity

  beforeEach(async () => {
    store = prepareStore({}).store
    const factory = await getReduxStoreFactory(store)
    communityAlpha = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')
    identity = await factory.create('Identity', {
      id: communityAlpha.id,
      nickname: 'john',
    })

    communityBeta = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')
  })

  it('select community by id', () => {
    const community = communitiesSelectors.selectById(communityBeta.id)(store.getState())
    expect(community).toBe(communityBeta)
  })

  it('select current community id', () => {
    const communityId = communitiesSelectors.currentCommunityId(store.getState())
    expect(communityId).toBe(communityAlpha.id)
  })

  it('select current community', () => {
    const community = communitiesSelectors.currentCommunity(store.getState())
    expect(community).toEqual({ ...communityAlpha })
  })
})
