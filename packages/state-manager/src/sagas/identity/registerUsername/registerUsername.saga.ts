import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, call, take, apply, delay } from 'typed-redux-saga'
import { createUserCsr, getPubKey, keyObjectFromString, loadPrivateKey, pubKeyFromCsr } from '@quiet/identity'
import { identitySelectors } from '../identity.selectors'
import { identityActions } from '../identity.slice'
import { config } from '../../users/const/certFieldTypes'
import { Socket } from '../../../types'
import { communitiesActions } from '../../communities/communities.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { CreateUserCsrPayload, RegisterCertificatePayload, Community } from '@quiet/types'

export function* registerUsernameSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.registerUsername>['payload']>
): Generator {
  console.log('Registering username')

  // Nickname can differ between saga calls

  const { nickname, isUsernameTaken = false } = action.payload

  let community = yield* select(communitiesSelectors.currentCommunity)
  if (!community) {
    console.warn('Community missing, waiting...')
    yield* take(communitiesActions.addNewCommunity)
  }
  community = yield* select(communitiesSelectors.currentCommunity)
  if (!community) {
    console.error('Could not register username, no community data')
    return
  }
  console.log('Found community', community.id)

  let identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) {
    console.warn('Identity missing, waiting...')
    yield* take(identityActions.addNewIdentity)
  }
  identity = yield* select(identitySelectors.currentIdentity)
  if (!identity) {
    console.error('Could not register username, no identity')
    return
  }
  console.log('Found identity', identity.id)

  let userCsr = identity.userCsr

  if (userCsr) {
    try {
      if (identity.userCsr?.userCsr == null || identity.userCsr.userKey == null) {
        console.error('identity.userCsr?.userCsr == null || identity.userCsr.userKey == null')
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
        signAlg: config.signAlg,
        hashAlg: config.hashAlg,
        existingKeyPair,
      }

      console.log('Recreating user CSR')
      userCsr = yield* call(createUserCsr, payload)
    } catch (e) {
      console.error('Error occurred while creating new CSR from existing', e)
      return
    }
  } else {
    try {
      const payload: CreateUserCsrPayload = {
        nickname,
        commonName: identity.hiddenService.onionAddress,
        peerId: identity.peerId.id,
        signAlg: config.signAlg,
        hashAlg: config.hashAlg,
      }

      console.log('Creating user CSR')
      userCsr = yield* call(createUserCsr, payload)
    } catch (e) {
      console.error('Error occurred while generating new user CSR', e)
      return
    }
  }

  // TODO: Can rename this type
  const payload: RegisterCertificatePayload = {
    communityId: community.id,
    nickname,
    userCsr,
    // TODO: Remove
    isUsernameTaken,
  }

  console.log('Adding user CSR to Redux', payload.communityId)
  yield* put(identityActions.addCsr(payload))

  if (community.CA?.rootCertString) {
    yield* put(communitiesActions.createCommunity(community.id))
  } else {
    if (!isUsernameTaken) {
      yield* put(communitiesActions.launchCommunity(community.id))
    } else {
      yield* put(identityActions.saveUserCsr())
    }
  }
}
