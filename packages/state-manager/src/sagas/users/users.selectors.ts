import { createSelector } from '@reduxjs/toolkit'
import { getCertFieldValue } from '@quiet/identity'
import { CertFieldsTypes } from './const/certFieldTypes'
import { StoreKeys } from '../store.keys'
import { certificatesAdapter } from './users.adapter'
import { Certificate } from 'pkijs'
import { CreatedSelectors, StoreState } from '../store.types'
import { User } from '@quiet/types'

const usersSlice: CreatedSelectors[StoreKeys.Users] = (state: StoreState) => state[StoreKeys.Users]

export const certificates = createSelector(usersSlice, reducerState =>
  certificatesAdapter.getSelectors().selectEntities(reducerState.certificates)
)

export const certificatesMapping = createSelector(certificates, certs => {
  const mapping: { [pubKey: string]: User } = {}
  Object.keys(certs).map(pubKey => {
    const certificate = certs[pubKey]
    if (!certificate || certificate.subject.typesAndValues.length < 1) {
      return
    }

    const username = getCertFieldValue(certificate, CertFieldsTypes.nickName)
    const onionAddress = getCertFieldValue(certificate, CertFieldsTypes.commonName)
    const peerId = getCertFieldValue(certificate, CertFieldsTypes.peerId)
    const dmPublicKey = getCertFieldValue(certificate, CertFieldsTypes.dmPublicKey) || ''

    if (!username || !onionAddress || !peerId) {
      console.error(`Could not parse certificate for pubkey ${pubKey}`)
      return
    }

    return (mapping[pubKey] = {
      username: username,
      onionAddress: onionAddress,
      peerId: peerId,
      dmPublicKey: dmPublicKey
    })
  })
  return mapping
})

export const getOldestParsedCerificate = createSelector(certificates, certs => {
  const getTimestamp = (cert: Certificate) => new Date(cert.notBefore.value).getTime()
  let certificates: Certificate[] = []
  Object.keys(certs).map(pubKey => {
    certificates = [...certificates, certs[pubKey]]
  })
  certificates.sort((a, b) => {
    const aTimestamp = getTimestamp(a)
    const bTimestamp = getTimestamp(b)
    return aTimestamp - bTimestamp
  })

  return certificates[0]
})

export const ownerData = createSelector(getOldestParsedCerificate, ownerCert => {
  const username = getCertFieldValue(ownerCert, CertFieldsTypes.nickName)
  const onionAddress = getCertFieldValue(ownerCert, CertFieldsTypes.commonName)
  const peerId = getCertFieldValue(ownerCert, CertFieldsTypes.peerId)
  const dmPublicKey = getCertFieldValue(ownerCert, CertFieldsTypes.dmPublicKey)

  return {
    username,
    onionAddress,
    peerId,
    dmPublicKey
  }
})

export const usersSelectors = {
  certificates,
  certificatesMapping,
  getOldestParsedCerificate,
  ownerData
}
