import { CertFieldsTypes, getCertFieldValue, loadCertificate } from '@quiet/identity'
import { call, put } from 'typed-redux-saga'
import { communitiesActions } from '../communities.slice'
import { type PayloadAction } from '@reduxjs/toolkit'

export function* updateCommunitySaga(
  action: PayloadAction<ReturnType<typeof communitiesActions.updateCommunity>['payload']>
): Generator {
  console.log('updateCommunitySaga', action.payload)
  const rootCa = loadCertificate(action.payload.rootCa)

  const communityName = yield* call(getCertFieldValue, rootCa, CertFieldsTypes.commonName)
  if (!communityName) {
    console.error(`Could not retrieve ${CertFieldsTypes.commonName} from rootca`)
    return
  }

  const payload = {
    id: action.payload.id,
    rootCa: action.payload.rootCa,
    name: communityName,
  }
  console.log('updateCommunitySaga::', payload)

  yield* put(communitiesActions.updateCommunityData(payload))
}
