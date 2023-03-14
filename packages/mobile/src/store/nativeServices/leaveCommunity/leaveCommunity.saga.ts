import { call, put } from 'typed-redux-saga'
import { persistor } from '../../store'
import { NativeModules } from 'react-native'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationActions } from '../../navigation/navigation.slice'
import { nativeServicesActions } from '../nativeServices.slice'

export function* leaveCommunitySaga(): Generator {
  // Stop backend
  yield* call(NativeModules.CommunicationModule.stopBackend)

  // Pause persistor
  yield* call(persistor.pause)
  yield* call(persistor.purge)

  // Remove community data
  yield* call(NativeModules.CommunicationModule.deleteBackendData)

  // Clear store
  yield* put(nativeServicesActions.resetApp())

  // Redirect user
  yield* put(navigationActions.replaceScreen({ screen: ScreenNames.JoinCommunityScreen }))

  // Restart backend
  yield* call(NativeModules.CommunicationModule.startBackend)
}
