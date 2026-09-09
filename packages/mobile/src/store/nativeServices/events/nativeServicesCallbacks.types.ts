import { app, network, publicChannels } from '@quiet/state-manager'
import { initActions } from '../../init/init.slice'
import { navigationActions } from '../../navigation/navigation.slice'
import { nativeServicesActions } from '../nativeServices.slice'

export interface BackendEvent {
  channelName: string
  payload: string
}

export interface AppPauseEvent {
  transitionId?: string
  isBackground?: boolean
}

export type NativeServicesEventAction =
  | ReturnType<typeof initActions.startWebsocketConnection>
  | ReturnType<typeof initActions.resumeWebsocketConnection>
  | ReturnType<typeof initActions.updateInitCheck>
  | ReturnType<typeof navigationActions.navigation>
  | ReturnType<typeof navigationActions.setPendingNavigation>
  | ReturnType<typeof publicChannels.actions.setCurrentChannel>
  | ReturnType<typeof nativeServicesActions.flushPersistor>
  | ReturnType<typeof app.actions.stopBackend>
  | ReturnType<typeof network.actions.removeInitializedCommunities>
