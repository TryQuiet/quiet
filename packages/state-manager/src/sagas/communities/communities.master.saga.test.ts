import { testSaga } from 'redux-saga-test-plan'
import { handleCommunityOnboarding } from './communities.master.saga'
import { communitiesActions } from './communities.slice'
import {
  CreateCommunityPayload,
  type DeviceInvitationData,
  InvitationDataVersion,
  InvitationKind,
  JoinCommunityPayload,
} from '@quiet/types'
import { createCommunitySaga } from './createCommunity/createCommunity.saga'
import { joinCommunitySaga } from './joinCommunity/joinCommunity.saga'
import { linkDeviceSaga } from './linkDevice/linkDevice.saga'
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
  } as Task

  ;(task as any)[TASK] = true

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
        version: InvitationDataVersion.v4,
        pairs: [],
        psk: 'psk',
        authData: {
          communityName: 'foobar',
          teamId: 'abc123',
          seed: 'def456',
        },
      },
    } as JoinCommunityPayload)
    const deviceInvite: DeviceInvitationData = {
      ...joinAction.payload.inviteData,
      kind: InvitationKind.Device,
      authData: {
        ...joinAction.payload.inviteData.authData,
        teamId: 'abc123',
        userId: 'user-id',
        userName: 'alice',
      },
    }
    const linkAction = communitiesActions.linkDevice({ inviteData: deviceInvite })

    const createTask = createTaskMock()
    const joinTask = createTaskMock()
    const linkTask = createTaskMock()
    const onboardingActions = [
      communitiesActions.createCommunity.type,
      communitiesActions.joinCommunity.type,
      communitiesActions.linkDevice.type,
    ]

    testSaga(handleCommunityOnboarding, socket)
      .next()
      .take(onboardingActions)
      .next(createAction)
      .fork(createCommunitySaga, socket, createAction)
      .next(createTask)
      .take(onboardingActions)
      .next(joinAction)
      .cancel(createTask)
      .next()
      .fork(joinCommunitySaga, socket, joinAction)
      .next(joinTask)
      .take(onboardingActions)
      .next(linkAction)
      .cancel(joinTask)
      .next()
      .fork(linkDeviceSaga, socket, linkAction)
      .next(linkTask)
      .take(onboardingActions)
  })
})
