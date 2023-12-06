import { type Socket, applyEmitParams } from '../../../types'
import { select, apply } from 'typed-redux-saga'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../identity.selectors'
import { type InitCommunityPayload, SocketActionTypes } from '@quiet/types'

export function* savedOwnerCertificateSaga(
  socket: Socket,
): Generator {

  const community = yield* select(communitiesSelectors.currentCommunity)

  
  const identity = yield* select(identitySelectors.currentIdentity)
  console.log('0', identity, community)
  if (!identity?.userCertificate || !identity?.userCsr || !community?.rootCa) return

  console.log('1')

  const payload: InitCommunityPayload = {
    id: community.id,
    peerId: identity.peerId,
    hiddenService: identity.hiddenService,
    certs: {
      certificate: identity.userCertificate,
      key: identity.userCsr.userKey,
      CA: [community.rootCa],
    },
  }

  console.log('emitting create community')

  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.CREATE_COMMUNITY, payload))
}
