import { select, call, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { identityActions } from '../identity.slice'
import { identitySelectors } from '../identity.selectors'
import { CertFieldsTypes, getReqFieldValue, loadCSR, pubKeyFromCsr } from '@quiet/identity'
import { LoggerModuleName, loggingHandler } from 'packages/state-manager/src/utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.IDENTITY, LoggerModuleName.SAGA, 'checkLocalCsr'])

export function* checkLocalCsrSaga(
  action: PayloadAction<ReturnType<typeof identityActions.checkLocalCsr>['payload']>
): Generator {
  LOGGER.info(`Checking local CSR: ${JSON.stringify(action.payload.csrs)}`)

  const { csrs } = action.payload

  const identity = yield* select(identitySelectors.currentIdentity)

  if (!identity) {
    LOGGER.error('Could not check local csr, no identity.')
    return
  }

  if (!identity.userCsr) {
    LOGGER.warn("Identity doesn't have userCsr.")
    return
  }

  const pubKey = yield* call(pubKeyFromCsr, identity.userCsr.userCsr)

  const storedCsr = csrs.find(csr => csr === identity.userCsr?.userCsr)

  if (storedCsr) {
    LOGGER.info(`Stored CSR with the same public key found, checking for username integirty.  pubkey = ${pubKey}`)

    const parsedCsr = yield* call(loadCSR, storedCsr)
    const nickname = yield* call(getReqFieldValue, parsedCsr, CertFieldsTypes.nickName)

    if (nickname == identity.nickname) {
      LOGGER.info('Stored CSR is equal to the local one, skipping.')
      return
    }
  }

  LOGGER.info('Stored CSR differs or missing, saving local one.')

  yield* put(identityActions.saveUserCsr())
}
