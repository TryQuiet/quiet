import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, call, take, apply, delay } from 'typed-redux-saga'
import { createUserCsr, getPubKey, keyObjectFromString, loadPrivateKey, pubKeyFromCsr } from '@quiet/identity'
import { identitySelectors } from '../identity.selectors'
import { identityActions } from '../identity.slice'
import { config } from '../../users/const/certFieldTypes'
import { Socket } from '../../../types'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { CreateUserCsrPayload, RegisterCertificatePayload, Community } from '@quiet/types'
import { loggingHandler, LoggerModuleName } from '../../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.IDENTITY, LoggerModuleName.SAGA, 'registerUsername'])

export function* registerUsernameSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.registerUsername>['payload']>
): Generator {
  // Nickname can differ between saga calls

  const { nickname, isUsernameTaken = false } = action.payload

  const community = yield* select(communitiesSelectors.currentCommunity)

  if (!community) {
    LOGGER.error('Could not register username, no community data')
    return
  }

  let identity = yield* select(identitySelectors.currentIdentity)

  if (!identity) {
    yield* take(identityActions.addNewIdentity)
  }

  identity = yield* select(identitySelectors.currentIdentity)

  if (!identity) {
    LOGGER.error('Could not register username, no identity')
    return
  }

  let userCsr = identity.userCsr

  if (userCsr) {
    try {
      if (identity.userCsr?.userCsr == null || identity.userCsr.userKey == null) {
        LOGGER.error('identity.userCsr?.userCsr == null || identity.userCsr.userKey == null')
        return
      }
      const _pubKey = yield* call(pubKeyFromCsr, identity.userCsr.userCsr)
      const privateKey = yield* call(loadPrivateKey, identity.userCsr.userKey, config.signAlg)
      const publicKey = yield* call(getPubKey, _pubKey)

      const existingKeyPair: CryptoKeyPair = { privateKey, publicKey }

      const payload: CreateUserCsrPayload = {
        nickname,
        commonName: identity.hiddenService.onionAddress,
        peerId: identity.peerId.id,
        dmPublicKey: identity.dmKeys.publicKey,
        signAlg: config.signAlg,
        hashAlg: config.hashAlg,
        existingKeyPair,
      }

      userCsr = yield* call(createUserCsr, payload)
    } catch (e) {
      LOGGER.error(`Error occurred while generating CSR payload from existing userCsr`, e)
      return
    }
  } else {
    try {
      const payload: CreateUserCsrPayload = {
        nickname,
        commonName: identity.hiddenService.onionAddress,
        peerId: identity.peerId.id,
        dmPublicKey: identity.dmKeys.publicKey,
        signAlg: config.signAlg,
        hashAlg: config.hashAlg,
      }
      userCsr = yield* call(createUserCsr, payload)
    } catch (e) {
      LOGGER.error(`Error occurred while generating new CSR payload`, e)
      return
    }
  }

  const payload: RegisterCertificatePayload = {
    communityId: community.id,
    nickname,
    userCsr,
    isUsernameTaken,
  }

  yield* put(identityActions.registerCertificate(payload))
}
