import { createSelector } from '@reduxjs/toolkit'
import { getCertFieldValue, getReqFieldValue } from '@quiet/identity'
import { CertFieldsTypes } from './const/certFieldTypes'
import { StoreKeys } from '../store.keys'
import { certificatesAdapter } from './users.adapter'
import { type Certificate } from 'pkijs'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { type UserData, User } from '@quiet/types'

const usersSlice: CreatedSelectors[StoreKeys.Users] = (state: StoreState) => state[StoreKeys.Users]

export const certificates = createSelector(usersSlice, reducerState =>
  certificatesAdapter.getSelectors().selectEntities(reducerState.certificates)
)

export const csrs = createSelector(usersSlice, reducerState =>
  certificatesAdapter.getSelectors().selectEntities(reducerState.csrs)
)

export const certificatesMapping = createSelector(certificates, certs => {
  const mapping: Record<string, UserData> = {}
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
      username,
      onionAddress,
      peerId,
      dmPublicKey,
    })
  })
  return mapping
})

export const csrsMapping = createSelector(csrs, csrs => {
  const mapping: Record<string, UserData> = {}
  Object.keys(csrs).map(pubKey => {
    const csr = csrs[pubKey]
    if (!csr || csr.subject.typesAndValues.length < 1) {
      return
    }

    getReqFieldValue

    const username = getReqFieldValue(csr, CertFieldsTypes.nickName)
    const onionAddress = getReqFieldValue(csr, CertFieldsTypes.commonName)
    const peerId = getReqFieldValue(csr, CertFieldsTypes.peerId)
    const dmPublicKey = getReqFieldValue(csr, CertFieldsTypes.dmPublicKey) || ''

    if (!username || !onionAddress || !peerId) {
      console.error(`Could not parse certificate for pubkey ${pubKey}`)
      return
    }

    return (mapping[pubKey] = {
      username,
      onionAddress,
      peerId,
      dmPublicKey,
    })
  })
  return mapping
})

export const allUsers = createSelector(csrsMapping, certificatesMapping, (csrs, certs) => {
  const users: Record<string, User> = {}
  const allUsernames: string[] = Object.values(csrs).map(u => u.username)
  const duplicateUsernames: string[] = allUsernames.filter((val, index) => allUsernames.indexOf(val) !== index)
  console.log('duplicate Usernames selector', duplicateUsernames)
  Object.keys(csrs).map(pubKey => {
    const username = csrs[pubKey].username
    const isDuplicated = duplicateUsernames.includes(username)
    const isRegistered = Boolean(certs[pubKey])
    users[pubKey] = {
      ...csrs[pubKey],
      isRegistered,
      isDuplicated,
      pubKey,
    }
  })
  // Temporary backward compatiblility! Old communities do not have csrs
  Object.keys(certs).map(pubKey => {
    if (users[pubKey]) return
    users[pubKey] = {
      ...certs[pubKey],
      isRegistered: true,
      isDuplicated: false,
      pubKey
    }
  })
  return users
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
    dmPublicKey,
  }
})

export const usersSelectors = {
  certificates,
  certificatesMapping,
  csrsMapping,
  getOldestParsedCerificate,
  ownerData,
  allUsers,
}
