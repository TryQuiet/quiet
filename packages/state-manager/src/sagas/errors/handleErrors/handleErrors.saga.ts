import { type PayloadAction } from '@reduxjs/toolkit'
import { put, select } from 'typed-redux-saga'
import { errorsActions } from '../errors.slice'
import { type ErrorPayload } from '@quiet/types'
import { ErrorMessages, SocketActions } from '@quiet/types'
import { communitiesActions } from '../../communities/communities.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'

/**
 * The requests the backend answers with `COMMUNITY_ALREADY_INITIALIZED`. Creating is not one
 * of them for the user's purposes: there is no invite field to report on, and the create flow
 * is not reachable from inside a community.
 */
const JOIN_ACTIONS: string[] = [SocketActions.JOIN_COMMUNITY, SocketActions.LINK_DEVICE]

export function* handleErrorsSaga(
  action: PayloadAction<ReturnType<typeof errorsActions.addError>['payload']>
): Generator {
  const error: ErrorPayload = action.payload

  // The backstop behind the clients' own "you already belong to a community" check: the
  // backend refuses a join or a device link outright when this device already has a
  // community, and without this the refusal would reach the user as the bare negative
  // acknowledgement ("check your invite link"), which says nothing about leaving first.
  if (error.message === ErrorMessages.COMMUNITY_ALREADY_INITIALIZED && JOIN_ACTIONS.includes(error.type)) {
    yield* put(communitiesActions.setJoinCommunityError({ type: 'alreadyMember' }))
  }

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
