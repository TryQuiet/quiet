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
        console.log('Sorry, you can only join one community at a time. This will change soon.')
        yield* put(modalsActions.openModal({ name: ModalName.singleCommunityWarningModal }))
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

    // display alert text
    console.error('CODE IS INVALID')
}
