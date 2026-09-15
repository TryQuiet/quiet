import { apply, cancelled, put, select } from 'typed-redux-saga'
import { ErrorMessages, isDeviceInvitationData, SocketActions } from '@quiet/types'
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
  const currentCommunityErrors = yield* select(errorsSelectors.currentCommunityErrors)
  const invalidInvite = currentCommunityErrors[SocketActions.LAUNCH_COMMUNITY]?.message === ErrorMessages.INVALID_INVITE
  if (!action.payload || action.payload !== currentId || (failure == null && !invalidInvite)) return
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)

  const result = invalidInvite
    ? ({ type: 'invalid' } as const)
    : ({
        type: failure!,
        invitationType:
          currentCommunity?.inviteData != null && isDeviceInvitationData(currentCommunity.inviteData)
            ? 'device'
            : 'community',
      } as const)

  yield* put(communitiesActions.setAdmissionResetResult(null))
  yield* put(communitiesActions.setAdmissionResetStatus('pending'))
  let completed = false
  try {
    const success = yield* apply(
      socket,
      socket.emitWithAck,
      applyEmitParams(SocketActions.RESET_ADMISSION, { id: currentId })
    )
    if (success !== true) throw new Error('Invitation cleanup was not acknowledged')
    // Platform cleanup must succeed before the provisional Redux state is erased.
    yield* put(communitiesActions.setAdmissionResetResult(result))
    yield* put(communitiesActions.setAdmissionResetStatus('complete'))
    completed = true
  } catch (error) {
    logger.error('Failed to clear timed-out invitation', error)
    yield* put(communitiesActions.setAdmissionResetStatus('failed'))
  } finally {
    if (!completed && (yield* cancelled())) {
      yield* put(communitiesActions.setAdmissionResetStatus('failed'))
    }
  }
}
