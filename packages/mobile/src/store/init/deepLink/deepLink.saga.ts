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

  // TODO: rename
  let isInvitationDataValid = false
  if (!data.version) data.version = InvitationDataVersion.v1

  switch (data.version) {
    case InvitationDataVersion.v1:
      const storedPsk = yield* select(communities.selectors.psk)
      const currentPsk = data.psk

      console.log('Stored psk', storedPsk)
      console.log('Current psk', currentPsk)

      if (!currentPsk) {
        isInvitationDataValid = false
      } else if (!storedPsk) {
        isInvitationDataValid = true
      } else {
        isInvitationDataValid = storedPsk === currentPsk
      }
      break
    default:
      isInvitationDataValid = true
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

  let payload: CreateNetworkPayload

  switch (data.version) {
    case InvitationDataVersion.v1:
      payload = {
        ownership: CommunityOwnership.User,
        peers: data.pairs,
        psk: data.psk,
        ownerOrbitDbIdentity: data.ownerOrbitDbIdentity,
      }
      break
    case InvitationDataVersion.v2:
      // get data from the server
      payload = {
        ownership: CommunityOwnership.User,
        peers: [],
        psk: 'TODO',
        ownerOrbitDbIdentity: 'TODO',
      }
  }

  yield* put(communities.actions.createNetwork(payload))

  console.log('INIT_NAVIGATION: Switching to the username registration screen.')

  yield* put(
    navigationActions.replaceScreen({
      screen: ScreenNames.UsernameRegistrationScreen,
    })
  )
}
