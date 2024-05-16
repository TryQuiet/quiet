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
import { createLogger } from '../../../utils/logger'

const logger = createLogger('createNetworkSaga')

export function* createNetworkSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createNetwork>['payload']>
) {
  logger.info('Creating network')

  const payload = action.payload
  logger.info('Payload:', payload)

  // Community IDs are only local identifiers
  logger.info('Generating community ID')
  const id = yield* call(generateId)

  logger.info('Emitting CREATE_NETWORK')
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

    logger.info('Generating CA')
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

  logger.info('Adding new community', id)
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

  logger.info('Adding new identity', identity.id)
  yield* put(identityActions.addNewIdentity(identity))

  logger.info('Network created')
}
