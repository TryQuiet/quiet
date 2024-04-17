import { PayloadAction } from '@reduxjs/toolkit'
import { apply, call, put } from 'typed-redux-saga'
import { Time } from 'pkijs'
import { generateId } from '../../../utils/cryptography/cryptography'
import { communitiesActions } from '../communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { createRootCA } from '@quiet/identity'
import {
  type Community,
  CommunityOwnership,
  type Identity,
  SocketActionTypes,
  NetworkInfo,
  InvitationDataVersion,
} from '@quiet/types'
import { Socket, applyEmitParams } from '../../../types'

export function* createNetworkSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createNetwork>['payload']>
) {
  // TODO: remove psk and orbitDbIdentity from payload and leave invitationData? Remove redundancy
  const payload = action.payload
  console.log('create network saga', payload)
  // Community IDs are only local identifiers
  const id = yield* call(generateId)

  const network: NetworkInfo = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.CREATE_NETWORK, id)
  )

  // TODO: Move CA generation to backend when creating Community
  let CA: null | {
    rootCertString: string
    rootKeyString: string
  } = null

  if (payload.ownership === CommunityOwnership.Owner) {
    const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
    const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))

    CA = yield* call(
      createRootCA,
      new Time({ type: 0, value: notBeforeDate }),
      new Time({ type: 0, value: notAfterDate }),
      action.payload.name
    )
  }

  const community: Community = {
    id,
    name: payload.name,
    CA,
    rootCa: CA?.rootCertString,
    inviteData: payload.inviteData,
  }

  if (payload.inviteData) {
    switch (payload.inviteData.version) {
      case InvitationDataVersion.v1:
        community.psk = payload.inviteData.psk
        community.ownerOrbitDbIdentity = payload.inviteData.ownerOrbitDbIdentity
        const invitationPeers = payload.inviteData.pairs
        if (invitationPeers) {
          yield* put(communitiesActions.setInvitationCodes(invitationPeers))
        }
        break
    }
  }

  console.log('SETTING COMMUNITY', community)

  yield* put(communitiesActions.addNewCommunity(community))
  yield* put(communitiesActions.setCurrentCommunity(id))

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
