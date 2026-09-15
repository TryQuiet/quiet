import { type Socket } from '../../types'
import { all, takeEvery, takeLeading, cancelled, fork, put, select, take } from 'typed-redux-saga'
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
type JoinCommunityAction = ReturnType<typeof communitiesActions.joinCommunity>
type LinkDeviceAction = ReturnType<typeof communitiesActions.linkDevice>
type OnboardingAction = CreateCommunityAction | JoinCommunityAction | LinkDeviceAction

export function* handleCommunityOnboarding(socket: Socket): Generator {
  let activeTask: Task | undefined

  while (true) {
    const action = (yield* take([
      communitiesActions.createCommunity.type,
      communitiesActions.joinCommunity.type,
      communitiesActions.linkDevice.type,
    ])) as OnboardingAction

    const admissionResetStatus = yield* select(communitiesSelectors.admissionResetStatus)
    if (admissionResetStatus !== 'idle') {
      logger.warn('Ignoring onboarding request while admission cleanup is incomplete')
      continue
    }

    if (activeTask) {
      if (activeTask.isRunning()) {
        logger.warn('Ignoring onboarding request while another onboarding operation is active')
        continue
      }
      activeTask = undefined
    }

    if (action.type === communitiesActions.createCommunity.type) {
      logger.info('Starting createCommunitySaga')
      activeTask = yield* fork(createCommunitySaga, socket, action)
    } else if (action.type === communitiesActions.joinCommunity.type) {
      logger.info('Starting joinCommunitySaga')
      activeTask = yield* fork(joinCommunitySaga, socket, action)
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
