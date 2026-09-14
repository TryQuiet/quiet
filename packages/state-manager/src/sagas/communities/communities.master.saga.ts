import { type Socket } from '../../types'
import { all, takeEvery, cancelled, fork, cancel, take } from 'typed-redux-saga'
import { communitiesActions } from './communities.slice'
import { connectionActions } from '../appConnection/connection.slice'
import { createCommunitySaga } from './createCommunity/createCommunity.saga'
import { initCommunitySaga, launchCommunitySaga } from './launchCommunity/launchCommunity.saga'
import { createLogger } from '../../utils/logger'
import { joinCommunitySaga } from './joinCommunity/joinCommunity.saga'
import { linkDeviceSaga } from './linkDevice/linkDevice.saga'
import type { Task } from 'redux-saga'

const logger = createLogger('communitiesMasterSaga')

export function* communitiesMasterSaga(socket: Socket): Generator {
  logger.info('communitiesMasterSaga starting')
  try {
    yield all([
      takeEvery(connectionActions.setTorInitialized.type, initCommunitySaga),
      fork(handleCommunityOnboarding, socket),
      takeEvery(communitiesActions.launchCommunity.type, launchCommunitySaga, socket),
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

    if (activeTask) {
      if (activeTask.isRunning()) {
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
      activeTask = yield* fork(joinCommunitySaga, socket, action)
    } else {
      logger.info('Starting linkDeviceSaga')
      activeTask = yield* fork(linkDeviceSaga, socket, action)
    }
  }
}
