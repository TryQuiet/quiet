import { call, put } from 'typed-redux-saga'
import { type Certificate } from 'pkijs'

import { CertFieldsTypes, getCertFieldValue, loadCertificate } from '@quiet/identity'
import { type PayloadAction } from '@reduxjs/toolkit'

import { communitiesActions } from '../communities.slice'

import { loggingHandler, LoggerModuleName } from '../../../utils/logger'

const LOGGER = loggingHandler.initLogger([LoggerModuleName.COMMUNITIES, LoggerModuleName.SAGA, 'updateCommunity'])

export function* updateCommunitySaga(
  action: PayloadAction<ReturnType<typeof communitiesActions.updateCommunity>['payload']>
): Generator {
  LOGGER.info(`Updating community with ID ${action.payload.id}`)
  let rootCa: Certificate
  let communityName: string | null = null

  if (action.payload.rootCa) {
    rootCa = loadCertificate(action.payload.rootCa)
    communityName = yield* call(getCertFieldValue, rootCa, CertFieldsTypes.commonName)

    if (!communityName) {
      LOGGER.error(`Could not retrieve ${CertFieldsTypes.commonName} from rootca`)
    }
  }

  const payload: {
    id: string
    name?: string
    rootCa?: string
    ownerCertificate?: string
    ownerOrbitDbIdentity?: string
  } = {
    id: action.payload.id,
  }

  if (communityName) {
    payload.name = communityName
  }

  if (action.payload.rootCa) {
    payload.rootCa = action.payload.rootCa
  }

  if (action.payload.ownerOrbitDbIdentity) {
    payload.ownerOrbitDbIdentity = action.payload.ownerOrbitDbIdentity
  }

  if (action.payload.ownerCertificate) {
    payload.ownerCertificate = action.payload.ownerCertificate
  }

  yield* put(communitiesActions.updateCommunityData(payload))
}
