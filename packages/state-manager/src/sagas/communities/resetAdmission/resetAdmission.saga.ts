import { apply, put, select } from 'typed-redux-saga'
import { isDeviceInvitationData, SocketActions } from '@quiet/types'
import type { PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, type Socket } from '../../../types'
import { communitiesActions } from '../communities.slice'
import { communitiesSelectors } from '../communities.selectors'
import { errorsSelectors } from '../../errors/errors.selectors'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('resetAdmissionSaga')

export function* resetAdmissionSaga(socket: Socket, action: PayloadAction<string>): Generator {
  const currentId = yield* select(communitiesSelectors.currentCommunityId)
  const failure = yield* select(errorsSelectors.admissionFailure)
  if (!action.payload || action.payload !== currentId || failure == null) return
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)

  yield* put(communitiesActions.setAdmissionResetStatus('pending'))
  try {
    const success = yield* apply(
      socket,
      socket.emitWithAck,
      applyEmitParams(SocketActions.RESET_ADMISSION, { id: currentId })
    )
    if (success !== true) throw new Error('Invitation cleanup was not acknowledged')
    // Both platforms clear invitation, identity, network, errors and onboarding state.
    yield* put(communitiesActions.resetApp(undefined))
    yield* put(
      communitiesActions.setJoinCommunityError({
        type: failure,
        invitationType:
          currentCommunity?.inviteData != null && isDeviceInvitationData(currentCommunity.inviteData)
            ? 'device'
            : 'community',
      })
    )
    yield* put(communitiesActions.setAdmissionResetStatus('complete'))
  } catch (error) {
    logger.error('Failed to clear timed-out invitation', error)
    yield* put(communitiesActions.setAdmissionResetStatus('failed'))
  }
}
