import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, delay } from 'typed-redux-saga'
import { CommunityOwnership, CreateNetworkPayload, InvitationData, InvitationDataVersion } from '@quiet/types'
import { communities, getInvitationCodes } from '@quiet/state-manager'
import { socketSelectors } from '../socket/socket.selectors'
import { ModalName } from '../modals/modals.types'
import { modalsActions } from '../modals/modals.slice'
import { areObjectsEqual, argvInvitationCode } from '@quiet/common'

export function* customProtocolSaga(
  action: PayloadAction<ReturnType<typeof communities.actions.customProtocol>['payload']>
): Generator {
  // TODO: refactor to remove code duplication. This is a slightly adjusted code from deepLink.saga.ts
  const code = action.payload

  console.log('INIT_NAVIGATION: Waiting for websocket connection before proceeding with deep link flow.')

  while (true) {
    const connected = yield* select(socketSelectors.isConnected)
    if (connected) {
      break
    }
    yield* delay(500)
  }

  console.log('INIT_NAVIGATION: Continuing on deep link flow.')

  let data: InvitationData | null

  try {
    data = argvInvitationCode(code)
  } catch (e) {
    console.warn(e.message)

    yield* put(communities.actions.clearInvitationCodes())
    yield* put(
      modalsActions.openModal({
        name: ModalName.warningModal,
        args: {
          title: 'Invalid link',
          subtitle: 'The invite link you received is not valid. Please check it and try again.',
        },
      })
    )
    return
  }

  if (data === null) {
    console.log(`Not processing invitation code ${code}`)
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
    yield* put(communities.actions.clearInvitationCodes()) // TODO: check out
    yield* put(
      modalsActions.openModal({
        name: ModalName.warningModal,
        args: {
          title: 'You already belong to a community',
          subtitle: "We're sorry but for now you can only be a member of a single community at a time.",
        },
      })
    )

    return
  }

  if (connectingWithAnotherCommunity) {
    console.log('INIT_NAVIGATION: Displaying error (user is already connecting to another community).')
    yield* put(communities.actions.clearInvitationCodes()) // TODO: check out
    yield* put(
      modalsActions.openModal({
        name: ModalName.warningModal,
        args: {
          title: 'You already started to connect to another community',
          subtitle: "We're sorry but for now you can only be a member of a single community at a time.",
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
  console.log('INIT_NAVIGATION: Creating network with payload', payload)
  yield* put(communities.actions.createNetwork(payload))
}
