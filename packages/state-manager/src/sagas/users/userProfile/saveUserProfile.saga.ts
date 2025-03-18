import { type PayloadAction } from '@reduxjs/toolkit'
import { call, select, apply, put } from 'typed-redux-saga'
import { arrayBufferToString } from 'pvutils'
import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'

import { sign, loadPrivateKey, pubKeyFromCsr, configCrypto } from '@quiet/identity'
import { UserProfile, UserProfileDisplayData, SocketActionTypes } from '@quiet/types'
import { fileToBase64String } from '@quiet/common'

import { identitySelectors } from '../../identity/identity.selectors'
import { type Socket, applyEmitParams } from '../../../types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('saveUserProfileSaga')

export function* saveUserProfileSaga(socket: Socket, action: PayloadAction<{ photo?: File }>): Generator {
  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity?.userId) {
    return
  }

  let base64EncodedPhoto: string | undefined
  if (action.payload.photo) {
    try {
      base64EncodedPhoto = yield* call(fileToBase64String, action.payload.photo)
    } catch (err) {
      logger.error('Failed to base64 encode profile photo', err)
      return
    }
  }

  const profile: UserProfileDisplayData = { nickname: identity.nickname }
  if (base64EncodedPhoto) {
    profile.photo = base64EncodedPhoto
  }

  const userProfile: UserProfile = {
    profile: profile,
    userId: identity.userId,
  }

  logger.info('Saving user profile', userProfile)

  yield* apply(socket, socket.emit, applyEmitParams(SocketActionTypes.SET_USER_PROFILE, userProfile))
}
