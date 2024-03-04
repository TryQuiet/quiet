import { PayloadAction } from '@reduxjs/toolkit'
import { apply, call, put } from 'typed-redux-saga'
import { Time } from 'pkijs'
import { generateId } from '../../../utils/cryptography/cryptography'
import { communitiesActions } from '../communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { type Community, CommunityOwnership, type Identity, SocketActionTypes } from '@quiet/types'
import { generateDmKeyPair } from '../../../utils/cryptography/cryptography'
import { Socket, applyEmitParams } from '../../../types'

export function* createNetworkSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createNetwork>['payload']>
) {
  console.log('create network saga')

  // Community IDs are only local identifiers
  const id = yield* call(generateId)
  const community: Community = {
    id,
    name: action.payload.name,
    psk: action.payload.psk,
    ownerOrbitDbIdentity: action.payload.ownerOrbitDbIdentity,
  }

  const invitationPeers = action.payload.peers
  if (invitationPeers) {
    yield* put(communitiesActions.setInvitationCodes(invitationPeers))
  }

  yield* put(communitiesActions.addNewCommunity(community))
  yield* put(communitiesActions.setCurrentCommunity(id))

  const network = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.CREATE_NETWORK, community.id)
  )
  const dmKeys = yield* call(generateDmKeyPair)
  const identity: Identity = {
    id: community.id,
    nickname: '',
    hiddenService: network.hiddenService,
    peerId: network.peerId,
    dmKeys,
    userCsr: null,
    userCertificate: null,
    joinTimestamp: null,
  }

  yield* put(identityActions.addNewIdentity(identity))
}
