import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, delay } from 'typed-redux-saga'
import { communities, CommunityOwnership, CreateNetworkPayload } from '@quiet/state-manager'
import { socketSelectors } from '../socket/socket.selectors'
import { ONION_ADDRESS_REGEX } from '@quiet/common'
import { ModalName } from '../modals/modals.types'
import { modalsActions } from '../modals/modals.slice'

export function* handleInvitationCodeSaga(
    action: PayloadAction<ReturnType<typeof communities.actions.handleInvitationCode>['payload']>
  ): Generator {
    while (true) {
      const connected = yield* select(socketSelectors.isConnected)
      if (connected) {
        break
      }
      yield* delay(500)
    }

    const currentCommunityId = yield* select(communities.selectors.currentCommunityId)
    if (currentCommunityId) {
        yield* put(modalsActions.openModal({
          name: ModalName.warningModal,
          args: {
            title: 'You already belong to a community',
            subtitle: "We're sorry but for now you can only be a member of a single community at a time."
          }
        }))
        return
    }

    const code = action.payload.trim()
    console.log(`Handling code ${code}`)
    if (code.match(ONION_ADDRESS_REGEX)) {
      const payload: CreateNetworkPayload = {
        ownership: CommunityOwnership.User,
        registrar: code
      }
      yield* put(communities.actions.createNetwork(payload))
      return
    }

    yield* put(modalsActions.openModal({
      name: ModalName.warningModal,
      args: {
        title: 'Invalid link',
        subtitle: 'The invite link you received is not valid. Please check it and try again.'
      }
    }))
}
