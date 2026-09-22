import { apply, call, put, select } from 'typed-redux-saga'
import { NativeModules } from 'react-native'
import { communities, type JoinCommunityError } from '@quiet/state-manager'
import type { Dispatch } from 'redux'
import { persistor } from '../../store'
import { navigationActions } from '../../navigation/navigation.slice'
import { JOIN_FAILURE_STACK } from '../../navigation/joinFailure'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { createLogger } from '../../../utils/logger'
import { icons } from '../../../assets'
import { nativeServicesActions } from '../nativeServices.slice'

const logger = createLogger('resetAdmission')

/** The kind of invitation a failure names, for the failures that name one at all. */
const invitationTypeOf = (result: JoinCommunityError): 'device' | 'community' | undefined =>
  'invitationType' in result ? result.invitationType : undefined

/**
 * Whether two reset results are the same failure, so that a replay can be told from a newer
 * reset. Kept keyed on what a failure actually carries rather than on which kinds happen to
 * carry an invitation type today.
 */
const sameAdmissionResetResult = (
  first: ReturnType<typeof communities.selectors.admissionResetResult>,
  second: ReturnType<typeof communities.selectors.admissionResetResult>
): boolean => {
  if (first == null || second == null) return false
  if (first.type !== second.type) return false
  return invitationTypeOf(first) === invitationTypeOf(second)
}

export function* finishAdmissionResetSaga(
  action: ReturnType<typeof communities.actions.setAdmissionResetStatus>
): Generator {
  if (action.payload === 'failed') {
    const communityId = yield* select(communities.selectors.currentCommunityId)
    if (!communityId) return
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: (dispatch: Dispatch) => dispatch(communities.actions.resetAdmission(communityId)),
          icon: icons.quiet_icon_round,
          title: 'Could not reset the failed connection',
          message: 'Quiet could not clear the incomplete invitation. Retry before using another invite.',
          buttonTitle: 'Retry',
        },
      })
    )
    return
  }

  if (action.payload !== 'complete') return

  yield* call(completeAdmissionResetSaga)
}

export function* retryAdmissionCleanupSaga(): Generator {
  const status = yield* select(communities.selectors.admissionResetStatus)
  if (status !== 'complete') return

  yield* call(completeAdmissionResetSaga)
}

export function* completeAdmissionResetSaga(): Generator {
  const result = yield* select(communities.selectors.admissionResetResult)
  if (result == null) {
    logger.error('Cannot finish admission reset without its preserved result')
    return
  }

  const communicationModule = NativeModules.CommunicationModule
  try {
    if (!communicationModule?.clearAdmissionCredentials) throw new Error('Native admission cleanup is unavailable')
    yield* apply(communicationModule, communicationModule.clearAdmissionCredentials, [])
  } catch (error) {
    logger.error('Failed to finish clearing invitation state', error)
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: (dispatch: Dispatch) => dispatch(nativeServicesActions.retryAdmissionCleanup()),
          icon: icons.quiet_icon_round,
          title: 'Could not finish resetting Quiet',
          message:
            'Your previous link was cleared from the backend, but this device still has admission data. Retry to finish before using another invite.',
          buttonTitle: 'Retry',
        },
      })
    )
    return
  }

  // A replay can race with reset finalization. Only apply the result while the same completed
  // reset is still current; shared onboarding remains blocked until this transition succeeds.
  const latestStatus = yield* select(communities.selectors.admissionResetStatus)
  const latestResult = yield* select(communities.selectors.admissionResetResult)
  if (latestStatus !== 'complete' || !sameAdmissionResetResult(result, latestResult)) return

  yield* put(communities.actions.finalizeAdmissionReset(result))
  yield* call(finishAdmissionFinalizationSaga)
}

export function* retryAdmissionFinalizationSaga(): Generator {
  yield* call(finishAdmissionFinalizationSaga)
}

export function* finishAdmissionFinalizationSaga(): Generator {
  try {
    yield* call(persistor.flush)
    yield* put(communities.actions.setAdmissionResetStatus('idle'))
    yield* put(navigationActions.resetToStack({ screens: JOIN_FAILURE_STACK }))
  } catch (error) {
    logger.error('Failed to persist the completed admission reset', error)
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: (dispatch: Dispatch) => dispatch(nativeServicesActions.retryAdmissionFinalization()),
          icon: icons.quiet_icon_round,
          title: 'Could not save the completed reset',
          message:
            'Quiet cleared the previous invitation data, but could not save the updated app state. Retry before using another invite.',
          buttonTitle: 'Retry',
        },
      })
    )
  }
}
