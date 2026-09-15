import { type PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { errorsActions } from '../errors.slice'
import { type ErrorPayload } from '@quiet/types'
import { ErrorMessages, SocketActions } from '@quiet/types'
import { communitiesActions } from '../../communities/communities.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'

export function* handleErrorsSaga(
  action: PayloadAction<ReturnType<typeof errorsActions.addError>['payload']>
): Generator {
  const error: ErrorPayload = action.payload
  const recoverableAdmissionError =
    error.community != null &&
    error.type === SocketActions.LAUNCH_COMMUNITY &&
    (error.message === ErrorMessages.ADMISSION_TIMEOUT || error.message === ErrorMessages.ADMISSION_INTERRUPTED)

  if (!recoverableAdmissionError) {
    yield* put(errorsActions.addError(error))
    return
  }

  const currentCommunityId = yield* select(communitiesSelectors.currentCommunityId)
  const admissionResetStatus = yield* select(communitiesSelectors.admissionResetStatus)
  const interruptedReceiptWithoutCommunity =
    !currentCommunityId && admissionResetStatus === 'idle' && error.message === ErrorMessages.ADMISSION_INTERRUPTED

  if (interruptedReceiptWithoutCommunity) {
    // Backend restart recovery can report its durable receipt before Redux has a provisional entity.
    yield* put(communitiesActions.setCurrentCommunity(error.community!))
  }
  yield* put(errorsActions.addError(error))

  if (
    admissionResetStatus === 'idle' &&
    (currentCommunityId === error.community || interruptedReceiptWithoutCommunity)
  ) {
    yield* put(communitiesActions.resetAdmission(error.community!))
  }
}
