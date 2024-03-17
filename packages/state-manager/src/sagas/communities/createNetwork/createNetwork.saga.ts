import { PayloadAction } from '@reduxjs/toolkit'
import { apply, call, put } from 'typed-redux-saga'
import { Time } from 'pkijs'
import { generateId } from '../../../utils/cryptography/cryptography'
import { communitiesActions } from '../communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { createRootCA } from '@quiet/identity'
import { type Community, CommunityOwnership, type Identity, SocketActionTypes } from '@quiet/types'
import { generateDmKeyPair } from '../../../utils/cryptography/cryptography'
import { Socket, applyEmitParams } from '../../../types'
import { LoggerModuleName, loggingHandler } from 'packages/state-manager/src/utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.COMMUNITIES, LoggerModuleName.SAGA, 'createNetwork'])

export function* createNetworkSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createNetwork>['payload']>
) {
  LOGGER.info(`Create network saga: starting with payload: ${JSON.stringify(action.payload)}`)
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

  const id = yield* call(generateId)
  const community: Community = {
    id,
    name: action.payload.name,
    CA,
    rootCa: CA?.rootCertString,
    psk: action.payload.psk,
    ownerOrbitDbIdentity: action.payload.ownerOrbitDbIdentity,
  }

  const invitationPeers = action.payload.peers
  if (invitationPeers) {
    yield* put(communitiesActions.setInvitationCodes(invitationPeers))
  }

  const psk = action.payload.psk
  if (psk) {
    LOGGER.info('Create network saga: saving PSK')
    yield* put(communitiesActions.savePSK(psk))
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
