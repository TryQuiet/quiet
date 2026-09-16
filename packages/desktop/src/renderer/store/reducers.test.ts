jest.mock('electron-store', () =>
  jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }))
)

jest.mock('redux-persist-electron-storage', () =>
  jest.fn().mockImplementation(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }))
)

import { communities } from '@quiet/state-manager'
import { type Community, CommunityOwnership, InvitationDataVersion, InvitationKind } from '@quiet/types'
import { StoreKeys } from './store.keys'
import { rootReducer } from './reducers'

describe('rootReducer', () => {
  it('preserves the live socket connection marker when resetting community state', () => {
    const initialState = rootReducer(undefined, { type: '@@INIT' })
    const connectedState = {
      ...initialState,
      [StoreKeys.Socket]: {
        ...initialState[StoreKeys.Socket],
        isConnected: true,
      },
    }

    const nextState = rootReducer(connectedState, communities.actions.resetApp('payload'))

    expect(nextState[StoreKeys.Socket].isConnected).toBe(true)
  })

  it('clears provisional data and retains the recovery result when finalizing admission reset', () => {
    const initialState = rootReducer(undefined, { type: '@@INIT' })
    const community: Community = {
      id: 'provisional',
      ownership: CommunityOwnership.User,
      name: 'Linked community',
      teamId: 'team-id',
      inviteData: {
        kind: InvitationKind.Device,
        version: InvitationDataVersion.v4,
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
    }
    let state = rootReducer(initialState, communities.actions.addNewCommunity(community))
    state = rootReducer(state, communities.actions.setCurrentCommunity(community.id))

    const result = { type: 'invalid' as const }
    const finalized = rootReducer(state, communities.actions.finalizeAdmissionReset(result))

    expect(communities.selectors.currentCommunity(finalized)).toBeUndefined()
    expect(communities.selectors.joinCommunityError(finalized)).toEqual(result)
    expect(communities.selectors.admissionResetStatus(finalized)).toBe('finalizing')
    expect(JSON.stringify(finalized)).not.toContain('credential-seed')
  })
})
