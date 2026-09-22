import { type Socket } from '../../types'
import { all, takeEvery, takeLeading, cancelled, fork, cancel, put, select, take } from 'typed-redux-saga'
import { communitiesActions } from './communities.slice'
import { connectionActions } from '../appConnection/connection.slice'
import { createCommunitySaga } from './createCommunity/createCommunity.saga'
import { initCommunitySaga, launchCommunitySaga } from './launchCommunity/launchCommunity.saga'
import { createLogger } from '../../utils/logger'
import { joinCommunitySaga } from './joinCommunity/joinCommunity.saga'
import { linkDeviceSaga } from './linkDevice/linkDevice.saga'
import type { Task } from 'redux-saga'
import { resetAdmissionSaga } from './resetAdmission/resetAdmission.saga'
import type { AdmissionResetCompletePayload } from '@quiet/types'
import type { PayloadAction } from '@reduxjs/toolkit'
import { communitiesSelectors } from './communities.selectors'

const logger = createLogger('communitiesMasterSaga')

export function* communitiesMasterSaga(socket: Socket): Generator {
  logger.info('communitiesMasterSaga starting')
  try {
    yield all([
      takeEvery(connectionActions.setTorInitialized.type, initCommunitySaga),
      fork(handleCommunityOnboarding, socket),
      takeEvery(communitiesActions.launchCommunity.type, launchCommunitySaga, socket),
      takeLeading(communitiesActions.resetAdmission.type, resetAdmissionSaga, socket),
      takeEvery(communitiesActions.admissionResetCompleted.type, handleAdmissionResetCompleted),
    ])
  } finally {
    logger.info('communitiesMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('communitiesMasterSaga cancelled')
    }
  }
}

type CreateCommunityAction = ReturnType<typeof communitiesActions.createCommunity>
type CancelCommunityOnboardingAction = ReturnType<typeof communitiesActions.cancelCommunityOnboarding>
type JoinCommunityAction = ReturnType<typeof communitiesActions.joinCommunity>
type LinkDeviceAction = ReturnType<typeof communitiesActions.linkDevice>
type OnboardingAction = CreateCommunityAction | CancelCommunityOnboardingAction | JoinCommunityAction | LinkDeviceAction

export function* handleCommunityOnboarding(socket: Socket): Generator {
  let activeTask: Task | undefined
  let activeJoinAttempt: number | undefined

  // A transport disconnect cancels this entire task tree. Resume only a draft
  // which has never sent JOIN_COMMUNITY; submitted requests are not safe to replay.
  const pendingJoin = yield* select(communitiesSelectors.pendingJoin)
  if (pendingJoin?.status === 'draft') {
    activeJoinAttempt = pendingJoin.attempt
    activeTask = yield* fork(joinCommunitySaga, socket)
  }

  while (true) {
    const action = (yield* take([
      communitiesActions.createCommunity.type,
      communitiesActions.cancelCommunityOnboarding.type,
      communitiesActions.joinCommunity.type,
      communitiesActions.linkDevice.type,
    ])) as OnboardingAction

    if (action.type === communitiesActions.cancelCommunityOnboarding.type) {
      if (activeTask?.isRunning()) yield* cancel(activeTask)
      activeTask = undefined
      continue
    }

    const admissionResetStatus = yield* select(communitiesSelectors.admissionResetStatus)
    if (admissionResetStatus !== 'idle') {
      logger.warn('Ignoring onboarding request while admission cleanup is incomplete')
      continue
    }

    if (action.type === communitiesActions.joinCommunity.type) {
      const pendingJoin = yield* select(communitiesSelectors.pendingJoin)
      if (!pendingJoin || pendingJoin.status !== 'draft') continue
      if (activeTask?.isRunning() && activeJoinAttempt === pendingJoin.attempt) continue
      activeJoinAttempt = pendingJoin.attempt
    } else {
      activeJoinAttempt = undefined
    }

    if (activeTask) {
      if (activeTask.isRunning()) {
        // develop/10.0.0 behaviour: a genuinely new onboarding request supersedes a
        // stale one. The duplicate-request guards above (same join attempt, or a
        // non-draft pendingJoin) already drop replays, and admission cleanup is
        // gated separately, so reaching here means the user asked for something new.
        logger.info('Cancelling active onboarding saga')
        yield* cancel(activeTask)
      }
      activeTask = undefined
    }

    if (action.type === communitiesActions.createCommunity.type) {
      logger.info('Starting createCommunitySaga')
      activeTask = yield* fork(createCommunitySaga, socket, action)
    } else if (action.type === communitiesActions.joinCommunity.type) {
      logger.info('Starting joinCommunitySaga')
      activeTask = yield* fork(joinCommunitySaga, socket)
    } else {
      logger.info('Starting linkDeviceSaga')
      activeTask = yield* fork(linkDeviceSaga, socket, action)
    }
  }
}

export function* handleAdmissionResetCompleted(action: PayloadAction<AdmissionResetCompletePayload>): Generator {
  const admissionResetStatus = yield* select(communitiesSelectors.admissionResetStatus)
  if (admissionResetStatus === 'finalizing') {
    logger.warn('Ignoring admission reset completion while finalization is being persisted')
    return
  }

  const currentCommunityId = yield* select(communitiesSelectors.currentCommunityId)
  if (currentCommunityId && currentCommunityId !== action.payload.id) {
    logger.warn('Ignoring admission reset completion for a different community', action.payload.id)
    return
  }

  yield* put(
    communitiesActions.setAdmissionResetResult({
      type: 'interrupted',
      invitationType: action.payload.invitationType,
    })
  )
  yield* put(communitiesActions.setAdmissionResetStatus('complete'))
}
