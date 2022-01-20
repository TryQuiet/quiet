import { CertFieldsTypes, getCertFieldValue, loadCertificate } from '@zbayapp/identity'
import { call, put } from 'typed-redux-saga'
import { communitiesActions } from '../communities.slice'
import { PayloadAction } from '@reduxjs/toolkit'

export function* updateCommunitySaga(action: PayloadAction<any>): Generator {
  const rootCa = loadCertificate(action.payload.rootCa)
  const communityName = yield* call(getCertFieldValue, rootCa, CertFieldsTypes.commonName)

  const payload = {
    id: action.payload.id,
    rootCa: action.payload.rootCa,
    name: communityName
  }

  yield* put(communitiesActions.updateCommunityData(payload))
}
