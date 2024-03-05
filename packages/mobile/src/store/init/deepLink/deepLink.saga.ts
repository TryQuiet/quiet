import { PayloadAction } from '@reduxjs/toolkit'
import { select, delay, put } from 'typed-redux-saga'
import { communities, getInvitationCodes } from '@quiet/state-manager'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationActions } from '../../navigation/navigation.slice'
import { initSelectors } from '../init.selectors'
import { initActions } from '../init.slice'
import { appImages } from '../../../assets'
import { replaceScreen } from '../../../RootNavigation'
import { CommunityOwnership, CreateNetworkPayload, InvitationData } from '@quiet/types'
import { areObjectsEqual } from '@quiet/common'

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
          title: 'Invalid invitation link',
          message: 'Please check your invitation link and try again',
        },
      })
    )
    return
  }

  const community = yield* select(communities.selectors.currentCommunity)

  const storedInvitationCodes = yield* select(communities.selectors.invitationCodes)
  const currentInvitationCodes = data.pairs

  console.log('Stored invitation codes', storedInvitationCodes)
  console.log('Current invitation codes', currentInvitationCodes)

  let isInvitationDataValid = false

  if (storedInvitationCodes.length === 0) {
    isInvitationDataValid = true
  } else {
    isInvitationDataValid = storedInvitationCodes.some(storedCode =>
      currentInvitationCodes.some(currentCode => areObjectsEqual(storedCode, currentCode))
    )
  }

  console.log('Is invitation data valid', isInvitationDataValid)

  const isAlreadyConnected = Boolean(community?.name)

  const alreadyBelongsWithAnotherCommunity = !isInvitationDataValid && isAlreadyConnected
  const connectingWithAnotherCommunity = !isInvitationDataValid && !isAlreadyConnected
  const alreadyBelongsWithCurrentCommunity = isInvitationDataValid && isAlreadyConnected
  const connectingWithCurrentCommunity = isInvitationDataValid && !isAlreadyConnected

  if (alreadyBelongsWithAnotherCommunity) {
    console.log('INIT_NAVIGATION: ABORTING: Already belongs with another community.')
  }

  if (connectingWithAnotherCommunity) {
    console.log('INIT_NAVIGATION: ABORTING: Proceeding with connection to another community.')
  }

  if (alreadyBelongsWithCurrentCommunity) {
    console.log('INIT_NAVIGATION: ABORTING: Already connected with the current community.')
  }

  if (connectingWithCurrentCommunity) {
    console.log('INIT_NAVIGATION: Proceeding with connection to the community.')
  }

  // User already belongs to a community
  if (alreadyBelongsWithAnotherCommunity || alreadyBelongsWithCurrentCommunity) {
    console.log('INIT_NAVIGATION: Displaying error (user already belongs to a community).')

    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: () => replaceScreen(ScreenNames.ChannelListScreen),
          icon: appImages.quiet_icon_round,
          title: 'You already belong to a community',
          message: "We're sorry but for now you can only be a member of a single community at a time",
        },
      })
    )

    return
  }

  if (connectingWithAnotherCommunity) {
    console.log('INIT_NAVIGATION: Displaying error (user is already connecting to another community).')

    yield* put(
      navigationActions.replaceScreen({
        screen: ScreenNames.ErrorScreen,
        params: {
          onPress: () => replaceScreen(ScreenNames.UsernameRegistrationScreen),
          icon: appImages.quiet_icon_round,
          title: 'You already started to connect to another community',
          message: "We're sorry but for now you can only be a member of a single community at a time",
        },
      })
    )

    return
  }

  const payload: CreateNetworkPayload = {
    ownership: CommunityOwnership.User,
    peers: data.pairs,
    psk: data.psk,
    ownerOrbitDbIdentity: data.ownerOrbitDbIdentity,
  }

  yield* put(communities.actions.createNetwork(payload))

  console.log('INIT_NAVIGATION: Switching to the username registration screen.')

  yield* put(
    navigationActions.replaceScreen({
      screen: ScreenNames.UsernameRegistrationScreen,
    })
  )
}
