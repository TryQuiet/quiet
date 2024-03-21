import { PayloadAction } from '@reduxjs/toolkit'
import { apply, call, put, select } from 'typed-redux-saga'
import { Time } from 'pkijs'
import { generateId } from '../../../utils/cryptography/cryptography'
import { communitiesActions } from '../communities.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identityActions } from '../../identity/identity.slice'
import { createRootCA } from '@quiet/identity'
import { type Community, CommunityOwnership, type Identity, SocketActionTypes } from '@quiet/types'
import { Socket, applyEmitParams } from '../../../types'

export function* createNetworkSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createNetwork>['payload']>
) {
  console.log('Creating network for community')

  const community = yield* select(communitiesSelectors.currentCommunity)

  if (!community) {
    console.error('Could not create network, no community')
    return
  }

  const network = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.CREATE_NETWORK, community.id)
  )

  // Identities are tied to communities for now
  const identity: Identity = {
    id: community.id,
    nickname: '',
    hiddenService: network.hiddenService,
    peerId: network.peerId,
    userCsr: null,
    userCertificate: null,
    joinTimestamp: null,
  }

  yield* put(identityActions.addNewIdentity(identity))
}
