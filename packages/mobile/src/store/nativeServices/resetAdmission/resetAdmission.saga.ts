import { apply, call, put } from 'typed-redux-saga'
import { NativeModules } from 'react-native'
import { communities } from '@quiet/state-manager'
import { persistor } from '../../store'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('resetAdmission')

/** Finish the platform-specific portion after state-manager/backend cleanup succeeded. */
export function* finishAdmissionResetSaga(
  action: ReturnType<typeof communities.actions.setAdmissionResetStatus>
): Generator {
  if (action.payload !== 'complete') return

  try {
    const communicationModule = NativeModules.CommunicationModule
    if (communicationModule?.clearSensitiveData) {
      yield* apply(communicationModule, communicationModule.clearSensitiveData, [])
    }
    yield* call(persistor.flush)
    yield* put(navigationActions.resetToScreen({ screen: ScreenNames.JoinCommunityScreen }))
    yield* put(communities.actions.setAdmissionResetStatus('idle'))
  } catch (error) {
    logger.error('Failed to finish clearing invitation state', error)
  }
}
