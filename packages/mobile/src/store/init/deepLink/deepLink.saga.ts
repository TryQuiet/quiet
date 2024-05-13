import { PayloadAction } from '@reduxjs/toolkit'
import { select, delay, put } from 'typed-redux-saga'
import { communities, getInvitationCodes } from '@quiet/state-manager'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationActions } from '../../navigation/navigation.slice'
import { initSelectors } from '../init.selectors'
import { initActions } from '../init.slice'
import { appImages } from '../../../assets'
import { replaceScreen } from '../../../RootNavigation'
import { CommunityOwnership, CreateNetworkPayload, InvitationData, InvitationDataVersion } from '@quiet/types'
import _ from 'lodash'
import {
  AlreadyBelongToCommunityWarning,
  InvalidInvitationLinkError,
  JoiningAnotherCommunityWarning,
} from '@quiet/common'

export function* deepLinkSaga(action: PayloadAction<ReturnType<typeof initActions.deepLink>['payload']>): Generator {
  const code = action.payload

  console.log('INIT_NAVIGATION: Waiting for websocket connection before proceeding with deep link flow.')

  while (true) {
    const connected = yield* select(initSelectors.isWebsocketConnected)
    if (connected) {
      break
    }
    yield* delay(500)
  }

  console.log('INIT_NAVIGATION: Continuing on deep link flow.')

  // Reset deep link flag for future redirections sake
  yield* put(initActions.resetDeepLink())

  let data: InvitationData
  try {
    data = getInvitationCodes(code)
  } catch (e) {
    console.warn(e.message)
    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: () => replaceScreen(ScreenNames.JoinCommunityScreen),
          icon: appImages.quiet_icon_round,
          title: InvalidInvitationLinkError.TITLE,
          message: InvalidInvitationLinkError.MESSAGE,
        },
      })
    )
    return
  }

  const community = yield* select(communities.selectors.currentCommunity)

  const isAlreadyConnected = Boolean(community?.name)

  // User already belongs to a community
  if (isAlreadyConnected) {
    console.log('INIT_NAVIGATION: Displaying error (user already belongs to a community).')

    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: () => replaceScreen(ScreenNames.ChannelListScreen),
          icon: appImages.quiet_icon_round,
          title: AlreadyBelongToCommunityWarning.TITLE,
          message: AlreadyBelongToCommunityWarning.MESSAGE,
        },
      })
    )

    return
  }

  let isJoiningAnotherCommunity = false

  switch (data.version) {
    case InvitationDataVersion.v1:
      const storedPsk = yield* select(communities.selectors.psk)
      const currentPsk = data.psk
      isJoiningAnotherCommunity = Boolean(storedPsk && storedPsk !== currentPsk)
      break
    case InvitationDataVersion.v2:
      const inviteData = yield* select(communities.selectors.inviteData)
      isJoiningAnotherCommunity = Boolean(inviteData && !_.isEqual(inviteData, data))
      break
  }

  const connectingWithAnotherCommunity = isJoiningAnotherCommunity && !isAlreadyConnected

  if (connectingWithAnotherCommunity) {
    console.log('INIT_NAVIGATION: Displaying error (user is already connecting to another community).')

    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: () => replaceScreen(ScreenNames.UsernameRegistrationScreen),
          icon: appImages.quiet_icon_round,
          title: JoiningAnotherCommunityWarning.TITLE,
          message: JoiningAnotherCommunityWarning.MESSAGE,
        },
      })
    )

    return
  }

  const payload: CreateNetworkPayload = {
    ownership: CommunityOwnership.User,
    inviteData: data,
  }

  yield* put(communities.actions.createNetwork(payload))

  yield* put(
    navigationActions.replaceScreen({
      screen: ScreenNames.UsernameRegistrationScreen,
    })
  )
}
