import { Socket } from 'socket.io-client'
import { call, put, apply, take } from 'typed-redux-saga'
import { Time } from 'pkijs'
import { PayloadAction } from '@reduxjs/toolkit'
import { createRootCA } from '@quiet/identity'
import { communitiesActions } from '../communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { generateID } from '../../../utils/cryptography/cryptography'
import { type Community, type Identity, CommunityOwnership, SocketActionTypes, InitCommunityPayload } from '@quiet/types'
import { applyEmitParams } from '../../../types'

export function* createNetworkSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createNetwork>['payload']>
) {




  /**
   * Can it be moved somwhere else?
   */
  const invitationPeers = action.payload.peers

  if (invitationPeers) {
    yield* put(communitiesActions.setInvitationCodes(invitationPeers))
  }
  /** ==== **/




  
  const { name, psk } = action.payload

  console.log('create network saga', name, psk)

  let CA: null | {
    rootCertString: string
    rootKeyString: string
  } = null

  if (action.payload.ownership === CommunityOwnership.Owner) {
    const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
    const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))

    CA = yield* call(
      createRootCA,
      new Time({ type: 0, value: notBeforeDate }),
      new Time({ type: 0, value: notAfterDate }),
      action.payload.name
    )
  }
  
  const id = yield* call(generateID)

  const payload: Community = {
    id: id,
    name: name,
    psk: psk,
    CA: CA,
    rootCa: CA?.rootCertString,
  }
  
  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.CREATE_NETWORK, payload))
  
  // Wait for response create network and add Identity
  const { network, community } = (yield* take(communitiesActions.responseCreateNetwork)).payload
  
  yield* put(communitiesActions.storeCommunity(community))

  if (psk) {
    yield* put(communitiesActions.savePSK(psk))
  }
  
  const identity: Identity = {
    id: community.id,
    nickname: '',
    hiddenService: network.hiddenService,
    peerId: network.peerId,
    userCsr: null,
    userCertificate: null,
    joinTimestamp: null,
  }

  yield* put(identityActions.storeIdentity(identity))
}
