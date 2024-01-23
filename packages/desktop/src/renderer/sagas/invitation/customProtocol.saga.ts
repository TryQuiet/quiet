import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, delay } from 'typed-redux-saga'
import { CommunityOwnership, CreateNetworkPayload } from '@quiet/types'
import { communities } from '@quiet/state-manager'
import { socketSelectors } from '../socket/socket.selectors'
import { ModalName } from '../modals/modals.types'
import { modalsActions } from '../modals/modals.slice'

export function* customProtocolSaga(
  action: PayloadAction<ReturnType<typeof communities.actions.customProtocol>['payload']>
): Generator {
  while (true) {
    const connected = yield* select(socketSelectors.isConnected)
    if (connected) {
      break
    }
    yield* delay(500)
  }

  const community = yield* select(communities.selectors.currentCommunity)
  if (community) {
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
  const invitationData = action.payload
  if (invitationData && invitationData.pairs.length > 0 && invitationData.psk && invitationData.ownerOrbitDbIdentity) {
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      peers: invitationData.pairs,
      psk: invitationData.psk,
      ownerOrbitDbIdentity: invitationData.ownerOrbitDbIdentity,
    }
    yield* put(communities.actions.createNetwork(payload))
  } else {
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
  }
}
