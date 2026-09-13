import { setupCrypto } from '@quiet/identity'
import { type Store } from '@reduxjs/toolkit'
import { getReduxStoreFactory } from '../../utils/tests/factories'
import { prepareStore, testReducers } from '../../utils/tests/prepareStore'
import { type identityActions } from '../identity/identity.slice'
import { communitiesSelectors } from './communities.selectors'
import { communitiesActions } from './communities.slice'
import { type Community, type Identity, type InvitationData, InvitationDataVersion, InvitationKind } from '@quiet/types'

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
  describe('usesServer', () => {
    const inviteV4: InvitationData = {
      kind: InvitationKind.Member,
      version: InvitationDataVersion.v4,
      psk: 'psk',
      pairs: [],
      authData: { communityName: 'rockets', seed: 'seed', teamId: 'team' },
    }
    const inviteV5: InvitationData = {
      kind: InvitationKind.Member,
      version: InvitationDataVersion.v5,
      psk: 'psk',
      pairs: [],
      authData: { communityName: 'rockets', seed: 'seed', teamId: 'team', salt: 'salt' },
      qssEnabled: true,
      qssEndpoint: 'https://qss.example',
    }

    it('is false for a community with no server', () => {
      expect(communitiesSelectors.usesServer(store.getState())).toBe(false)
    })

    it('is true once the community record says the community has one', () => {
      store.dispatch(communitiesActions.updateCommunityData({ id: communityAlpha.id, updates: { qssEnabled: true } }))
      expect(communitiesSelectors.usesServer(store.getState())).toBe(true)
    })

    it('reads a pending join from its invite, before any community record exists', () => {
      store.dispatch(communitiesActions.joinCommunity({ inviteData: inviteV5 }))
      expect(communitiesSelectors.usesServer(store.getState())).toBe(true)
    })

    it('is false for a pending join on a v4 invite, whatever the current community is', () => {
      store.dispatch(communitiesActions.updateCommunityData({ id: communityAlpha.id, updates: { qssEnabled: true } }))
      store.dispatch(communitiesActions.joinCommunity({ inviteData: inviteV4 }))
      expect(communitiesSelectors.usesServer(store.getState())).toBe(false)
    })

    it("reads a pending create from the owner's own answer", () => {
      store.dispatch(communitiesActions.createCommunity({ name: 'rockets', useServer: true }))
      expect(communitiesSelectors.usesServer(store.getState())).toBe(true)

      store.dispatch(communitiesActions.createCommunity({ name: 'rockets', useServer: false }))
      expect(communitiesSelectors.usesServer(store.getState())).toBe(false)
    })

    it('forgets the remembered answer once the backend hands back a record', async () => {
      store.dispatch(communitiesActions.createCommunity({ name: 'rockets', useServer: true }))
      expect(communitiesSelectors.pendingUseServer(store.getState())).toBe(true)

      store.dispatch(communitiesActions.addNewCommunity({ ...communityBeta, qssEnabled: false }))
      expect(communitiesSelectors.pendingUseServer(store.getState())).toBeNull()
    })
  })
})
