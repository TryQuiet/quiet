import { PayloadAction, Dispatch } from '@reduxjs/toolkit'
import { select, delay, put } from 'typed-redux-saga'
import { communities, getInvitationCodes } from '@quiet/state-manager'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationActions } from '../../navigation/navigation.slice'
import { initSelectors } from '../init.selectors'
import { initActions } from '../init.slice'
import { icons } from '../../../assets'
import { replaceScreen } from '../../../RootNavigation'
import { InvitationData, InvitationDataVersion, JoinCommunityPayload } from '@quiet/types'
import {
  AlreadyBelongToCommunityWarning,
  InvalidInvitationLinkError,
  JoiningAnotherCommunityWarning,
} from '@quiet/common'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('deepLink')

export const DEEP_LINK_CONNECTION_TIMEOUT_MS = 15000
const CONNECTION_POLL_MS = 250

/**
 * Handles invitation deep links
 */
export function* deepLinkSaga(action: PayloadAction<ReturnType<typeof initActions.deepLink>['payload']>): Generator {
  const code = action.payload

  let data: InvitationData
  try {
    data = getInvitationCodes(code)
  } catch (e) {
    logger.error(e)
    yield* put(initActions.resetDeepLink())
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: () => replaceScreen(ScreenNames.JoinCommunityScreen),
          icon: icons.quiet_icon_round,
          title: InvalidInvitationLinkError.TITLE,
          message: InvalidInvitationLinkError.MESSAGE,
        },
      })
    )
    return
  }

  logger.info('INIT_NAVIGATION: Waiting for websocket connection before proceeding with deep link flow.')
  let connected = yield* select(initSelectors.isWebsocketConnected)
  if (!connected) yield* put(initActions.resumeWebsocketConnection())
  for (let elapsed = 0; !connected && elapsed < DEEP_LINK_CONNECTION_TIMEOUT_MS; elapsed += CONNECTION_POLL_MS) {
    yield* delay(CONNECTION_POLL_MS)
    connected = yield* select(initSelectors.isWebsocketConnected)
  }
  if (!connected) {
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          // Keep the invitation in this live retry action, like invitationCodes.
          // Navigation is not persisted: invite credentials must not reach disk.
          onPress: (dispatch: Dispatch) => {
            dispatch(navigationActions.replaceScreen({ screen: ScreenNames.SplashScreen }))
            dispatch(initActions.deepLink(code))
          },
          icon: icons.quiet_icon_round,
          title: "Couldn't open invitation",
          message: "Quiet couldn't reconnect. Tap Continue to try this invitation again.",
        },
      })
    )
    return
  }

  logger.info('INIT_NAVIGATION: Continuing on deep link flow.')
  yield* put(initActions.resetDeepLink())

  const community = yield* select(communities.selectors.currentCommunity)

  const isAlreadyConnected = Boolean(community?.name)

  // User already belongs to a community
  if (isAlreadyConnected) {
    logger.info('INIT_NAVIGATION: Displaying error (user already belongs to a community).')

    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: () => replaceScreen(ScreenNames.AppHomeScreen),
          icon: icons.quiet_icon_round,
          title: AlreadyBelongToCommunityWarning.TITLE,
          message: AlreadyBelongToCommunityWarning.MESSAGE,
        },
      })
    )

    return
  }

  let isJoiningAnotherCommunity = false

  let storedPsk: string | undefined = undefined
  let currentPsk: string | undefined = undefined
  switch (data.version) {
    case InvitationDataVersion.v4:
    case InvitationDataVersion.v5: // Question: should we also check if the sig chain team name is different or something?  is the psk enough?
      storedPsk = yield* select(communities.selectors.psk)
      currentPsk = data.psk
      isJoiningAnotherCommunity = Boolean(storedPsk && storedPsk !== currentPsk)
      break
  }

  const connectingWithAnotherCommunity = isJoiningAnotherCommunity && !isAlreadyConnected

  if (connectingWithAnotherCommunity) {
    logger.info('INIT_NAVIGATION: Displaying error (user is already connecting to another community).')

    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: () => replaceScreen(ScreenNames.UsernameRegistrationScreen),
          icon: icons.quiet_icon_round,
          title: JoiningAnotherCommunityWarning.TITLE,
          message: JoiningAnotherCommunityWarning.MESSAGE,
        },
      })
    )

    return
  }

  const payload: JoinCommunityPayload = {
    inviteData: data,
  }

  yield* put(communities.actions.joinCommunity(payload))

  yield* put(
    navigationActions.replaceScreen({
      screen: ScreenNames.UsernameRegistrationScreen,
    })
  )
}
