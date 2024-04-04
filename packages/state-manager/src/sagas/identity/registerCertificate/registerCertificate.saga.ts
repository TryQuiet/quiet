import { applyEmitParams, type Socket } from '../../../types'
import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, select, put } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identityActions } from '../identity.slice'
import {
  type RegisterOwnerCertificatePayload,
  type RegisterUserCertificatePayload,
  SocketActionTypes,
} from '@quiet/types'
import { communitiesActions } from '../../communities/communities.slice'
import createLogger from '../../../utils/logger'

const logger = createLogger('identity')

export function* registerCertificateSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.registerCertificate>['payload']>
): Generator {
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  const isUsernameTaken = action.payload.isUsernameTaken

  if (!currentCommunity) {
    logger.error('Could not register certificate, no current community')
    return
  }

  if (currentCommunity.CA?.rootCertString) {
    yield* put(communitiesActions.createCommunity(action.payload.communityId))
  } else {
    if (!isUsernameTaken) {
      yield* put(communitiesActions.launchCommunity(action.payload.communityId))
    } else {
      yield* put(identityActions.saveUserCsr())
    }
  }
}
