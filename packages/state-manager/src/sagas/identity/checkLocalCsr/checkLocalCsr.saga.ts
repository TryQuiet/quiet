import { select, call, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { identityActions } from '../identity.slice'
import { identitySelectors } from '../identity.selectors'
import { CertFieldsTypes, getReqFieldValue, loadCSR, pubKeyFromCsr } from '@quiet/identity'
import createLogger from '../../../utils/logger'

const logger = createLogger('identity')

export function* checkLocalCsrSaga(
  action: PayloadAction<ReturnType<typeof identityActions.checkLocalCsr>['payload']>
): Generator {
  logger.info('Checking local CSR', action.payload.csrs)

  const { csrs } = action.payload

  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity) {
    logger.error('Could not check local csr, no identity.')
    return
  }

  if (!identity.userCsr) {
    logger.warn("Identity doesn't have userCsr.")
    return
  }

  const pubKey = yield* call(pubKeyFromCsr, identity.userCsr.userCsr)

  const storedCsr = csrs.find(csr => csr === identity.userCsr?.userCsr)

  if (storedCsr) {
    logger.info('Stored CSR with the same public key found, checking for username integirty.', pubKey)

    const parsedCsr = yield* call(loadCSR, storedCsr)
    const nickname = yield* call(getReqFieldValue, parsedCsr, CertFieldsTypes.nickName)

    if (nickname == identity.nickname) {
      logger.info('Stored CSR is equal to the local one, skipping.')
      return
    }
  }

  logger.info('Stored CSR differs or missing, saving local one.')

  yield* put(identityActions.saveUserCsr())
}
