import { call, put, take } from 'typed-redux-saga'
import { NativeModules } from 'react-native'
import { persistor } from '../../store'
import { app } from '@quiet/state-manager'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationActions } from '../../navigation/navigation.slice'
import { nativeServicesActions } from '../nativeServices.slice'
import { initActions } from '../../init/init.slice'

export function* leaveCommunitySaga(): Generator {
  // Stop backend
  yield* put(app.actions.closeServices())

  while (true) {
    const action = yield* take()
    if (action.type === initActions.backendClosed.type) {
      break
    }
  }

  // Clear persistor
  yield* call(persistor.pause)
  yield* call(persistor.purge)

  // Remove community data
  yield* call(NativeModules.CommunicationModule.deleteBackendData)

  // Clear store
  yield* put(nativeServicesActions.resetApp())

  // Redirect user
  yield* put(navigationActions.replaceScreen({ screen: ScreenNames.JoinCommunityScreen }))

  // Restart backend
  // yield* call(NativeModules.CommunicationModule.startBackend)
}
