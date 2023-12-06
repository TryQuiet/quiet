import { StoreKeys } from '../store.keys'
import { createSelector } from 'reselect'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { invitationShareUrl } from '@quiet/common'
import { CertFieldsTypes, getCertFieldValue, parseCertificate } from '@quiet/identity'
import { getOldestParsedCerificate } from '../users/users.selectors'

// Workaround for "The inferred type of 'communitiesSelectors' cannot be named without a reference to
// 'packages/identity/node_modules/pkijs/build'. This is likely not portable. A type annotation is necessary."
// https://github.com/microsoft/TypeScript/issues/47663#issuecomment-1270716220
import type {} from 'pkijs'

const communitiesSlice: CreatedSelectors[StoreKeys.Communities] = (state: StoreState) => state[StoreKeys.Communities]

export const currentCommunity = createSelector(communitiesSlice, (state) => {
  return state.community
})

export const invitationCodes = createSelector(communitiesSlice, reducerState => {
  return reducerState.invitationCodes
})

export const psk = createSelector(communitiesSlice, reducerState => {
  return reducerState.psk
})

export const invitationUrl = createSelector(currentCommunity, psk, (community, communityPsk) => {
  const peerList = community?.peerList
  if (!peerList || peerList?.length === 0) return ''
  if (!communityPsk) return ''
  const initialPeers = peerList.slice(0, 4)
  return invitationShareUrl(initialPeers, communityPsk)
})

export const ownerNickname = createSelector(
  currentCommunity,
  getOldestParsedCerificate,
  (community, oldestParsedCerificate) => {
    if (!oldestParsedCerificate) return undefined
    const ownerCertificate = community?.ownerCertificate || undefined

    let nickname: string | null = null

    if (ownerCertificate) {
      const certificate = ownerCertificate
      const parsedCert = parseCertificate(certificate)
      nickname = getCertFieldValue(parsedCert, CertFieldsTypes.nickName)
    } else {
      nickname = getCertFieldValue(oldestParsedCerificate.certificate, CertFieldsTypes.nickName)
    }

    if (!nickname) {
      console.error('Could not retrieve owner nickname from certificate')
    }

    return nickname
  }
)

export const communitiesSelectors = {
  currentCommunity,
  invitationCodes,
  invitationUrl,
  ownerNickname,
  psk,
}
