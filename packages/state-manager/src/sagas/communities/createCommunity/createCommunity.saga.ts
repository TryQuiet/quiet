import { type Socket, applyEmitParams } from '../../../types'
import { select, apply, put } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { identityActions } from '../../identity/identity.slice'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { type Community, type InitCommunityPayload, SocketActionTypes } from '@quiet/types'
import logger from '../../../utils/logger'
const log = logger('createCommunity')

export function* createCommunitySaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createCommunity>['payload']>
): Generator {
  let communityId: string = action.payload

  if (!communityId) {
    communityId = yield* select(communitiesSelectors.currentCommunityId)
  }

  log(communityId)

  const community = yield* select(communitiesSelectors.selectById(communityId))
  const identity = yield* select(identitySelectors.selectById(communityId))

  if (!identity) return

  const payload: InitCommunityPayload = {
    id: communityId,
    name: community?.name,
    peerId: identity.peerId,
    hiddenService: identity.hiddenService,
    CA: community?.CA,
    rootCa: community?.rootCa,
    // Type mismatch between `userCsr | null` in Identity and `ownerCsr?` in
    // InitCommunityPayload
    ownerCsr: identity.userCsr ?? undefined,
  }

  const createdCommunity: Community | undefined = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.CREATE_COMMUNITY, payload)
  )

  if (!createdCommunity || !createdCommunity.ownerCertificate) return

  yield* put(communitiesActions.updateCommunityData(createdCommunity))

  yield* put(
    identityActions.storeUserCertificate({
      communityId: createdCommunity.id,
      userCertificate: createdCommunity.ownerCertificate,
    })
  )

  yield* put(publicChannelsActions.createGeneralChannel())
  // TODO: We can likely refactor this a bit. Currently, we issue the owner's
  // certificate before creating the community, but then we add the owner's CSR
  // to the OrbitDB store after creating the community (in the following saga).
  // We can likely add the owner's CSR when creating the community or decouple
  // community creation from CSR/certificate creation and create the community
  // first and then add the owner's CSR and issue their certificate.
  yield* put(identityActions.saveUserCsr())
}
