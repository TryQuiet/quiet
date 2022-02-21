import { call, select, put } from 'typed-redux-saga'
import { createUserCsr } from '@quiet/identity'
import { PayloadAction } from '@reduxjs/toolkit'
import { identityActions } from '../identity.slice'
import { UserCsr } from '../identity.types'
import { communitiesSelectors } from '../../communities/communities.selectors'
import logger from '../../../utils/logger'
const log = logger('identity')

export function* createUserCsrSaga(
  action: PayloadAction<
  ReturnType<typeof identityActions.createUserCsr>['payload']
  >
): Generator {
  let csr: UserCsr

  try {
    csr = yield* call(createUserCsr, action.payload)
  } catch (e) {
    console.error(e)
    return
  }

  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)

  const payload = {
    communityId: currentCommunity.id,
    userCsr: csr,
    registrarAddress: yield* select(
      communitiesSelectors.registrarUrl(currentCommunity.id)
    )
  }

  log('createUserCsrSaga')

  yield* put(identityActions.registerCertificate(payload))
}
