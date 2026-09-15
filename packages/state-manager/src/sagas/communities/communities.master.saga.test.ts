import { testSaga } from 'redux-saga-test-plan'
import { handleAdmissionResetCompleted, handleCommunityOnboarding } from './communities.master.saga'
import { communitiesActions } from './communities.slice'
import { communitiesSelectors } from './communities.selectors'
import {
  CreateCommunityPayload,
  type DeviceInvitationData,
  InvitationDataVersion,
  InvitationKind,
  JoinCommunityPayload,
} from '@quiet/types'
import { createCommunitySaga } from './createCommunity/createCommunity.saga'
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

  it('ignores overlapping onboarding while the active backend request is running', () => {
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
    const linkAction = communitiesActions.linkDevice({ inviteData: deviceInvite, deviceLinkConsent: true })

    const createTask = createTaskMock()
    const onboardingActions = [
      communitiesActions.createCommunity.type,
      communitiesActions.joinCommunity.type,
      communitiesActions.linkDevice.type,
    ]

    testSaga(handleCommunityOnboarding, socket)
      .next()
      .take(onboardingActions)
      .next(createAction)
      .select(communitiesSelectors.admissionResetStatus)
      .next('idle')
      .fork(createCommunitySaga, socket, createAction)
      .next(createTask)
      .take(onboardingActions)
      .next(joinAction)
      .select(communitiesSelectors.admissionResetStatus)
      .next('idle')
      .take(onboardingActions)
      .next(linkAction)
      .select(communitiesSelectors.admissionResetStatus)
      .next('idle')
      .take(onboardingActions)
  })

  it.each(['pending', 'complete', 'failed', 'finalizing'] as const)(
    'ignores onboarding while admission reset status is %s',
    status => {
      const createAction = communitiesActions.createCommunity({ name: 'Test', useServer: false })
      const onboardingActions = [
        communitiesActions.createCommunity.type,
        communitiesActions.joinCommunity.type,
        communitiesActions.linkDevice.type,
      ]

      testSaga(handleCommunityOnboarding, socket)
        .next()
        .take(onboardingActions)
        .next(createAction)
        .select(communitiesSelectors.admissionResetStatus)
        .next(status)
        .take(onboardingActions)
    }
  )

  it('finishes interrupted cleanup when the replay matches the current community', () => {
    const action = communitiesActions.admissionResetCompleted({
      id: 'community-id',
      invitationType: 'device',
    })

    testSaga(handleAdmissionResetCompleted, action)
      .next()
      .select(communitiesSelectors.admissionResetStatus)
      .next('idle')
      .select(communitiesSelectors.currentCommunityId)
      .next('community-id')
      .put(
        communitiesActions.setAdmissionResetResult({
          type: 'interrupted',
          invitationType: 'device',
        })
      )
      .next()
      .put(communitiesActions.setAdmissionResetStatus('complete'))
      .next()
      .isDone()
  })

  it('finishes interrupted cleanup when no provisional community is rehydrated', () => {
    const action = communitiesActions.admissionResetCompleted({
      id: 'deleted-community-id',
      invitationType: 'community',
    })

    testSaga(handleAdmissionResetCompleted, action)
      .next()
      .select(communitiesSelectors.admissionResetStatus)
      .next('idle')
      .select(communitiesSelectors.currentCommunityId)
      .next('')
      .put(
        communitiesActions.setAdmissionResetResult({
          type: 'interrupted',
          invitationType: 'community',
        })
      )
      .next()
      .put(communitiesActions.setAdmissionResetStatus('complete'))
      .next()
      .isDone()
  })

  it('ignores reset replay for a different active community', () => {
    const action = communitiesActions.admissionResetCompleted({
      id: 'deleted-community-id',
      invitationType: 'device',
    })

    testSaga(handleAdmissionResetCompleted, action)
      .next()
      .select(communitiesSelectors.admissionResetStatus)
      .next('idle')
      .select(communitiesSelectors.currentCommunityId)
      .next('healthy-community-id')
      .isDone()
  })

  it('ignores reset replay while cleared state is being persisted', () => {
    const action = communitiesActions.admissionResetCompleted({
      id: 'deleted-community-id',
      invitationType: 'device',
    })

    testSaga(handleAdmissionResetCompleted, action)
      .next()
      .select(communitiesSelectors.admissionResetStatus)
      .next('finalizing')
      .isDone()
  })
})
