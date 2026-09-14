import { apply, put, select } from 'typed-redux-saga'
import { isDeviceInvitationData, SocketActions } from '@quiet/types'
import type { PayloadAction } from '@reduxjs/toolkit'
import { applyEmitParams, type Socket } from '../../../types'
import { communitiesActions } from '../communities.slice'
import { communitiesSelectors } from '../communities.selectors'
import { errorsSelectors } from '../../errors/errors.selectors'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('resetAdmissionSaga')

/**
 * Requests backend admission cleanup before clearing the local onboarding state.
 * The community id check prevents a delayed reset from clearing a newer attempt.
 */
export function* resetAdmissionSaga(socket: Socket, action: PayloadAction<string>): Generator {
  const currentId = yield* select(communitiesSelectors.currentCommunityId)
  const failure = yield* select(errorsSelectors.admissionFailure)

  if (!action.payload || action.payload !== currentId || failure == null) return

  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  yield* put(communitiesActions.setAdmissionResetStatus('pending'))

  try {
    const acknowledged = yield* apply(
      socket,
      socket.emitWithAck,
      applyEmitParams(SocketActions.RESET_ADMISSION, { id: currentId })
    )

    if (acknowledged !== true) throw new Error('Admission cleanup was not acknowledged')

    // Root reducers on each platform clear identity, community, network and errors.
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
