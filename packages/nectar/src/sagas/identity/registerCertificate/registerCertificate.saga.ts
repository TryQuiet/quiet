import { Socket } from 'socket.io-client'
import { PayloadAction } from '@reduxjs/toolkit'
import { apply, select, put } from 'typed-redux-saga'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { identityActions } from '../identity.slice'
import { DateTime } from 'luxon'

export function* registerCertificateSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.storeUserCsr>['payload']>
): Generator {
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  if (currentCommunity.CA?.rootCertString) {
    yield* apply(socket, socket.emit, [
      SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
      action.payload.communityId,
      action.payload.userCsr.userCsr,
      {
        certificate: currentCommunity.CA?.rootCertString,
        privKey: currentCommunity.CA?.rootKeyString
      }
    ])

    const channel = {
      name: 'general',
      description: 'Welcome to #general',
      owner: '',
      address: 'general',
      timestamp: DateTime.utc().valueOf()
    }

    // PeerId is required for creating PublicChannel so it cannot be done before registering owner's certificate
    yield* put(
      publicChannelsActions.createChannel({
        communityId: action.payload.communityId,
        channel: channel
      })
    )

    yield* put(
      publicChannelsActions.setCurrentChannel({
        communityId: action.payload.communityId,
        channel: channel.address
      })
    )
  } else {
    const registrarUrl = action.payload.registrarAddress.includes(':')
      ? `http://${action.payload.registrarAddress}`
      : `http://${action.payload.registrarAddress}.onion`

    yield* apply(socket, socket.emit, [
      SocketActionTypes.REGISTER_USER_CERTIFICATE,
      registrarUrl,
      action.payload.userCsr.userCsr,
      action.payload.communityId
    ])
  }
}
