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
  CreateNetworkPayload,
} from '@quiet/types'
import { Socket, applyEmitParams } from '../../../types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('createNetworkSaga')

export function* createNetworkSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.createNetwork>['payload']>
) {
  logger.info('Creating network')

  const payload = action.payload as CreateNetworkPayload

  // Community IDs are only local identifiers
  logger.info('Generating community ID')
  const id = yield* call(generateId)

  logger.info('Network created')
}
