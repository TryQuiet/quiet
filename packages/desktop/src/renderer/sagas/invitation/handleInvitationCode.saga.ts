import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, delay } from 'typed-redux-saga'
import { communities, CommunityOwnership, CreateNetworkPayload } from '@quiet/state-manager'
import { socketSelectors } from '../socket/socket.selectors'

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
        // display alert text
        console.log('Sorry, you can only join one community at a time. This will change soon.')
        return
    }

    const code = action.payload.trim()
    console.log(`Handling code ${code}`)
    if (code.match(/^[a-z0-9]{56}$/g)) {
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
