import { CommunityOwnership } from '@quiet/types'

import { StoreKeys } from '../store.keys'
import { CommunitiesState } from './communities.slice'
import { CommunitiesTransform } from './communities.transform'

describe('CommunitiesTransform', () => {
  const createState = () => {
    const state = new CommunitiesState()
    state.communities = {
      ids: ['provisional'],
      entities: {
        provisional: {
          id: 'provisional',
          ownership: CommunityOwnership.User,
          name: 'Linked community',
          teamId: 'team-id',
          inviteData: {
            kind: 'device',
            version: 'v4',
            pairs: [],
            psk: 'credential-psk',
            authData: {
              communityName: 'Linked community',
              seed: 'credential-seed',
              teamId: 'team-id',
              userId: 'user-id',
              userName: 'Alice',
            },
          },
        },
      },
    } as CommunitiesState['communities']
    state.invitationCodes = state.communities.entities.provisional!.inviteData!
    return state
  }

  it('removes every invite copy before persistence without changing provisional runtime state', () => {
    const state = createState()
    const persisted = CommunitiesTransform.in(state, StoreKeys.Communities, {})

    expect(persisted.invitationCodes).toBeUndefined()
    expect(persisted.communities.entities.provisional?.inviteData).toBeUndefined()
    expect(state.invitationCodes?.authData.seed).toBe('credential-seed')
    expect(state.communities.entities.provisional?.inviteData?.authData.seed).toBe('credential-seed')
    expect(JSON.stringify(persisted)).not.toContain('credential-seed')
  })

  it('scrubs invite data restored from storage written by an older version', () => {
    const restored = CommunitiesTransform.out(createState(), StoreKeys.Communities, {})

    expect(restored.communities.entities.provisional?.inviteData).toBeUndefined()
    expect(JSON.stringify(restored)).not.toContain('credential-seed')
  })
})
