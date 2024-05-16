import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'
import { put, apply, delay } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
// import { v4 as uuidv4 } from 'uuid'
import { applyEmitParams, type Socket } from '../../../types'
import { InvitationDataV2, InvitationDataVersion, SocketActionTypes } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('shareCommunitySaga')

export function* shareCommunitySaga(socket: Socket): Generator {
  // TODO: check if the user is using QSS
  let cid = ''
  cid = yield* apply(socket, socket.emitWithAck, applyEmitParams(SocketActionTypes.QSS_STORE_INVITE_DATA, {}))
  // TODO: store the cid in the state so that it can be used in the invite link
  // yield* put(communitiesActions.setInvitationCodes([{ cid, token: payload.token }])
}
