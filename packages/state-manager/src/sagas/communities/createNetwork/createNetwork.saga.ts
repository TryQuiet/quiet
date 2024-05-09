import { PayloadAction } from '@reduxjs/toolkit'
import { apply, call, put } from 'typed-redux-saga'
import { Time } from 'pkijs'
import { generateId } from '../../../utils/cryptography/cryptography'
import { communitiesActions } from '../communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { createRootCA } from '@quiet/identity'
import { type Community, CommunityOwnership, type Identity, SocketActionTypes } from '@quiet/types'
import { Socket, applyEmitParams } from '../../../types'

export function* createNetworkSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createNetwork>['payload']>
) {
  console.log('Creating network')

  // Community IDs are only local identifiers
  console.log('Generating community ID')
  const id = yield* call(generateId)

  console.log('Emitting CREATE_NETWORK')
  const network = yield* apply(socket, socket.emitWithAck, applyEmitParams(SocketActionTypes.CREATE_NETWORK, id))

  // TODO: Move CA generation to backend when creating Community
  let CA: null | {
    rootCertString: string
    rootKeyString: string
  } = null

  if (action.payload.ownership === CommunityOwnership.Owner) {
    const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
    const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))

    console.log('Generating CA')
    CA = yield* call(
      createRootCA,
      new Time({ type: 0, value: notBeforeDate }),
      new Time({ type: 0, value: notAfterDate }),
      action.payload.name
    )
  }

  const community: Community = {
    id,
    name: action.payload.name,
    CA,
    rootCa: CA?.rootCertString,
    psk: action.payload.psk,
    ownerOrbitDbIdentity: action.payload.ownerOrbitDbIdentity,
  }

  console.log('Adding new community', id)
  yield* put(communitiesActions.addNewCommunity(community))
  yield* put(communitiesActions.setCurrentCommunity(id))

  const invitationPeers = action.payload.peers
  if (invitationPeers) {
    yield* put(communitiesActions.setInvitationCodes(invitationPeers))
  }

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

  console.log('Adding new identity', identity.id)
  yield* put(identityActions.addNewIdentity(identity))

  console.log('Network created')
}
