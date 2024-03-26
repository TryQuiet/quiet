import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, delay } from 'typed-redux-saga'
import { InvitationData, InvitationDataVersion } from '@quiet/types'
import { communities } from '@quiet/state-manager'
import { socketSelectors } from '../socket/socket.selectors'
import { ModalName } from '../modals/modals.types'
import { modalsActions } from '../modals/modals.slice'
import { argvInvitationCode } from '@quiet/common'

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

  let isJoiningAnotherCommunity = false

  switch (data.version) {
    case InvitationDataVersion.v1:
      const storedPsk = yield* select(communities.selectors.psk)
      const currentPsk = data.psk

      console.log('Stored psk', storedPsk)
      console.log('Current psk', currentPsk)

      isJoiningAnotherCommunity = Boolean(storedPsk && storedPsk !== currentPsk)
      break
  }

  const isAlreadyConnected = Boolean(community?.name)
  const connectingWithAnotherCommunity = isJoiningAnotherCommunity && !isAlreadyConnected

  // User already belongs to a community
  if (isAlreadyConnected) {
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

  yield* put(communities.actions.joinNetwork(data))
}
