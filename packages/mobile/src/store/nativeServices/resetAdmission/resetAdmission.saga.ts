import { apply, call, put, select } from 'typed-redux-saga'
import { NativeModules } from 'react-native'
import { communities } from '@quiet/state-manager'
import type { Dispatch } from 'redux'
import { persistor } from '../../store'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { createLogger } from '../../../utils/logger'
import { icons } from '../../../assets'
import { nativeServicesActions } from '../nativeServices.slice'

const logger = createLogger('resetAdmission')

const sameAdmissionResetResult = (
  first: ReturnType<typeof communities.selectors.admissionResetResult>,
  second: ReturnType<typeof communities.selectors.admissionResetResult>
): boolean =>
  first?.type === second?.type &&
  (first?.type === 'invalid' ||
    (second != null && second.type !== 'invalid' && first?.invitationType === second.invitationType))

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

/**
 * Where a cleared invitation puts the user. The failure is reported on the invite
 * field, so the flow comes back to the field the link was typed in rather than to
 * the three-way choice, which has nothing to carry the message. `finalizeAdmissionReset`
 * has wiped Redux, the navigator included, so the path the user would have walked is
 * rebuilt beneath the paste screen and its back arrow retraces it.
 */
export const ADMISSION_FAILURE_STACK = [
  ScreenNames.GetStartedScreen,
  ScreenNames.JoinCommunityScreen,
  ScreenNames.OpenInviteLinkScreen,
  ScreenNames.PasteInviteLinkScreen,
]

export function* finishAdmissionFinalizationSaga(): Generator {
  try {
    yield* call(persistor.flush)
    yield* put(communities.actions.setAdmissionResetStatus('idle'))
    yield* put(navigationActions.resetToStack({ screens: ADMISSION_FAILURE_STACK }))
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
