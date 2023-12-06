import { CertFieldsTypes, getCertFieldValue, loadCertificate } from '@quiet/identity'
import { call, put, select } from 'typed-redux-saga'
import { communitiesActions } from '../communities.slice'
import { communitiesSelectors } from '../communities.selectors'
import { type PayloadAction } from '@reduxjs/toolkit'
import { Community } from '@quiet/types'

export function* updateCommunitySaga(
  action: PayloadAction<ReturnType<typeof communitiesActions.updateCommunity>['payload']>
): Generator {
  const rootCa = loadCertificate(action.payload.rootCa)

  const communityName = yield* call(getCertFieldValue, rootCa, CertFieldsTypes.commonName)
  if (!communityName) {
    console.error(`Could not retrieve ${CertFieldsTypes.commonName} from rootca`)
    return
  }

  const community = yield* select(communitiesSelectors.currentCommunity)

  const payload: Community = {
    ...community,
    rootCa: action.payload.rootCa,
    name: communityName,
  }

  yield* put(communitiesActions.updateCommunityData(payload))
}
