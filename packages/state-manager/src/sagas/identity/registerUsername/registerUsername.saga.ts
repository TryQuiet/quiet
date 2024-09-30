import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, call, take, apply, delay } from 'typed-redux-saga'
import { createUserCsr, getPubKey, keyObjectFromString, loadPrivateKey, pubKeyFromCsr } from '@quiet/identity'
import { identitySelectors } from '../identity.selectors'
import { identityActions } from '../identity.slice'
import { config } from '../../users/const/certFieldTypes'
import { Socket, applyEmitParams } from '../../../types'
import { communitiesActions } from '../../communities/communities.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { CreateUserCsrPayload, RegisterCertificatePayload, Community, SocketActionTypes, Identity } from '@quiet/types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('registerUsernameSaga')

export function* registerUsernameSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.registerUsername>['payload']>
): Generator {
  logger.info('Registering username')

  // Nickname can differ between saga calls

  const { nickname, isUsernameTaken = false } = action.payload

  let community = yield* select(communitiesSelectors.currentCommunity)
  if (!community) {
    logger.warn('Community missing, waiting...')
    yield* take(communitiesActions.addNewCommunity)
  }
  community = yield* select(communitiesSelectors.currentCommunity)
  if (!community) {
    logger.error('Could not register username, no community data')
    return
  }
  logger.info('Found community', community.id)

  logger.info('Emitting CREATE_USER_CSR')
  const identity = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActionTypes.CREATE_USER_CSR, { id: community.id, nickname: nickname })
  )
  identityActions.addCsr(identity)
  if (community.CA?.rootCertString) {
    yield* put(communitiesActions.createCommunity(community.id))
  } else {
    if (!isUsernameTaken) {
      logger.info('Username is not taken, launching community')
      yield* put(communitiesActions.launchCommunity(community.id))
    }
  }
}
