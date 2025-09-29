import { testSaga } from 'redux-saga-test-plan'
import { handleCommunityOnboarding } from './communities.master.saga'
import { communitiesActions } from './communities.slice'
import { CreateCommunityPayload, InvitationDataVersion, JoinCommunityPayload } from '@quiet/types'
import { createCommunitySaga } from './createCommunity/createCommunity.saga'
import { joinCommunitySaga } from './joinCommunity/joinCommunity.saga'
import type { Socket } from '../../types'
import type { Task } from 'redux-saga'
import { TASK } from '@redux-saga/symbols'

const createTaskMock = (overrides: Partial<Task> = {}): Task => {
  const task = {
    isRunning: () => true,
    isCancelled: () => false,
    result: () => undefined,
    error: () => undefined,
    toPromise: () => Promise.resolve(undefined),
    cancel: () => undefined,
    setContext: () => undefined,
    ...overrides,
  } as Task & { [TASK]?: boolean }

  task[TASK] = true

  return task
}

describe('handleCommunityOnboarding', () => {
  const socket = {} as Socket

  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('cancels the in-progress onboarding before starting a new one', () => {
    const createAction = communitiesActions.createCommunity({
      name: 'Test',
      useServer: false,
    } as CreateCommunityPayload)
    const joinAction = communitiesActions.joinCommunity({
      inviteData: {
        version: InvitationDataVersion.v1,
        pairs: [],
        psk: 'psk',
        ownerOrbitDbIdentity: 'owner',
      },
    } as JoinCommunityPayload)

    const createTask = createTaskMock()
    const joinTask = createTaskMock()

    testSaga(handleCommunityOnboarding, socket)
      .next()
      .take([communitiesActions.createCommunity.type, communitiesActions.joinCommunity.type])
      .next(createAction)
      .fork(createCommunitySaga, socket, createAction)
      .next(createTask)
      .take([communitiesActions.createCommunity.type, communitiesActions.joinCommunity.type])
      .next(joinAction)
      .cancel(createTask)
      .next()
      .fork(joinCommunitySaga, socket, joinAction)
      .next(joinTask)
      .take([communitiesActions.createCommunity.type, communitiesActions.joinCommunity.type])
  })
})
