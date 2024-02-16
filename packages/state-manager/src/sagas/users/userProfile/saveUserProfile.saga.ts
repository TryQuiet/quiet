import { type PayloadAction } from '@reduxjs/toolkit'
import { call, select, apply, put } from 'typed-redux-saga'
import { arrayBufferToString } from 'pvutils'
import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'

import { sign, loadPrivateKey, pubKeyFromCsr } from '@quiet/identity'
import { UserProfile, UserProfileData, SocketActionTypes } from '@quiet/types'
import { fileToBase64String } from '@quiet/common'

import { config } from '../../users/const/certFieldTypes'
import { identitySelectors } from '../../identity/identity.selectors'
import logger from '../../../utils/logger'
import { usersActions } from '../users.slice'
import { type Socket, applyEmitParams } from '../../../types'

const log = logger('saveUserProfileSaga')

export function* saveUserProfileSaga(socket: Socket, action: PayloadAction<{ photo?: File }>): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity?.userCsr || !action.payload.photo) {
    return
  }

  let base64EncodedPhoto: string
  try {
    base64EncodedPhoto = yield* call(fileToBase64String, action.payload.photo)
  } catch (err) {
    log.error('Failed to base64 encode profile photo', err)
    return
  }

  const profile: UserProfileData = { photo: base64EncodedPhoto }
  const codec = dagCbor
  const hasher = sha256
  const { bytes } = yield* call(Block.encode, { value: profile, codec: codec, hasher: hasher })
  const keyObject = yield* call(loadPrivateKey, identity.userCsr.userKey, config.signAlg)
  const signatureArrayBuffer = yield* call(sign, bytes, keyObject)
  const signature = yield* call(arrayBufferToString, signatureArrayBuffer)
  const pubKey = yield* call(pubKeyFromCsr, identity.userCsr.userCsr)

  const userProfile: UserProfile = {
    profile: profile,
    profileSig: signature,
    pubKey,
  }

  console.log('Saving user profile', userProfile)

  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.UPDATE_USER_PROFILE, userProfile))
}
