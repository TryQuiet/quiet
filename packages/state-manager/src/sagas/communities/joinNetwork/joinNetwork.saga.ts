import { CommunityOwnership, CreateNetworkPayload, InvitationDataVersion, SocketActionTypes } from '@quiet/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { apply, put } from 'typed-redux-saga'
import { Socket, applyEmitParams } from '../../../types'
import { communitiesActions } from '../communities.slice'

export function* joinNetworkSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.joinNetwork>['payload']>
) {
  console.log('join network saga', action.payload)
  const data = action.payload
  let payload: CreateNetworkPayload

  data.version = data.version || InvitationDataVersion.v1
  switch (data.version) {
    case InvitationDataVersion.v1:
      console.log('join network saga invitation data v1')
      payload = {
        ownership: CommunityOwnership.User,
        peers: data.pairs,
        psk: data.psk,
        ownerOrbitDbIdentity: data.ownerOrbitDbIdentity,
      }
      break
    case InvitationDataVersion.v2:
      console.log('join network saga invitation data v2')
      const response: CreateNetworkPayload = yield* apply(
        socket,
        socket.emitWithAck,
        applyEmitParams(SocketActionTypes.DOWNLOAD_INVITE_DATA, {
          serverAddress: data.serverAddress,
          cid: data.cid,
        })
      )
      payload = {
        ownership: CommunityOwnership.User,
        peers: response.peers,
        psk: response.psk,
        ownerOrbitDbIdentity: response.ownerOrbitDbIdentity,
      }
      break
  }

  console.log('join network saga payload', payload)
  yield* put(communitiesActions.createNetwork(payload))
}
