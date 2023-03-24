import { PayloadAction } from '@reduxjs/toolkit'
import { select, delay, put } from 'typed-redux-saga'
import { communities, CommunityOwnership, CreateNetworkPayload } from '@quiet/state-manager'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationActions } from '../../navigation/navigation.slice'
import { initSelectors } from '../init.selectors'
import { initActions } from '../init.slice'
import { appImages } from '../../../../assets'
import { replaceScreen } from '../../../RootNavigation'

export function* deepLinkSaga(
  action: PayloadAction<ReturnType<typeof initActions.deepLink>['payload']>
): Generator {
  const code = action.payload

  while (true) {
    const connected = yield* select(initSelectors.isWebsocketConnected)
    if (connected) {
      break
    }
    yield* delay(500)
  }

  const community = yield* select(communities.selectors.currentCommunity)

  // The same url has been used to open an app
  if (community?.registrarUrl.includes(code)) {
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelListScreen
      })
    )
    return
  }

  // User already belongs to a community
  if (community) {
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: () => replaceScreen(ScreenNames.ChannelListScreen),
          icon: appImages.quiet_icon_round,
          title: 'You already belong to a community',
          message:
            "We're sorry but for now you can only be a member of a single community at a time"
        }
      })
    )
    return
  }

  yield* put(
    navigationActions.replaceScreen({
      screen: ScreenNames.JoinCommunityScreen,
      params: {
        code: code
      }
    })
  )

  const payload: CreateNetworkPayload = {
    ownership: CommunityOwnership.User,
    registrar: code
  }

  yield* put(communities.actions.createNetwork(payload))
}
