import { expectSaga } from 'redux-saga-test-plan'
import { Blob } from 'buffer'
import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { stringToArrayBuffer } from 'pvutils'
import { getCrypto } from 'pkijs'

import { saveUserProfileSaga } from './saveUserProfile.saga'
import { usersActions } from '../users.slice'
import { identityActions } from '../../identity/identity.slice'
import { communitiesActions } from '../../communities/communities.slice'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { type Socket } from '../../../types'
import { type Identity } from '@quiet/types'

import { createUserCsr, pubKeyFromCsr, keyObjectFromString, verifySignature } from '@quiet/identity'
import { getAppDataPath } from '@quiet/common'

jest.mock('@quiet/common', () => ({
  fileToBase64String: jest.fn(() => 'dGVzdAo='),
  getAppDataPath: jest.fn(() => '.'),
}))

describe('saveUserProfileSaga', () => {
  test('sends user profile to backend', async () => {
    const store = prepareStore().store
    const socket = { emit: jest.fn() }
    const csr = await createUserCsr({
      nickname: '',
      commonName: '',
      peerId: '',
      dmPublicKey: '',
      signAlg: '',
      hashAlg: '',
    })

    store.dispatch(
      identityActions.addNewIdentity({
        id: 'test',
        userCsr: csr,
      } as Identity)
    )

    store.dispatch(communitiesActions.setCurrentCommunity('test'))

    const profile = { photo: 'dGVzdAo=' }
    const codec = dagCbor
    const hasher = sha256
    const { bytes } = await Block.encode({ value: profile, codec, hasher })
    const pubKey = pubKeyFromCsr(csr.userCsr)
    const pubKeyObj = await keyObjectFromString(pubKey, getCrypto())

    // We are testing browser-targeting code in NodeJS and this
    // version of NodeJS doesn't have a File class, so we are using a
    // Blob instead.
    await expectSaga(
      saveUserProfileSaga,
      socket as unknown as Socket,
      // @ts-ignore
      usersActions.saveUserProfile({ photo: new Blob([]) })
    )
      .withState(store.getState())
      .run()

    const actual = socket.emit.mock.calls[0][1]
    const actualSig = actual.profileSig
    delete actual['profileSig']

    expect(actual).toStrictEqual({ profile: profile, pubKey })
    expect(await verifySignature(stringToArrayBuffer(actualSig), bytes, pubKeyObj)).toBe(true)
  })
})
