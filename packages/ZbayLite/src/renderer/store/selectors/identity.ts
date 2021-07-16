
import { createSelector } from 'reselect'

import { Store } from '../reducers'

const identity = (s: Store) => s.identity

const data = createSelector(identity, i => i.data)

const id = createSelector(data, d => d.id)
const name = createSelector(data, d => d.name)

const nickName = createSelector(identity, i => i.registrationStatus.nickname)

const shieldingTax = createSelector(data, d => d.shieldingTax)

const signerPrivKey = createSelector(data, d => d.signerPrivKey)
export const signerPubKey = createSelector(data, d => d.signerPubKey)

const address = createSelector(data, d => d.address)
const onionAddress = createSelector(data, d => d.onionAddress)
const addresses = createSelector(data, d => d.addresses)

const loader = createSelector(identity, i => i.loader)

const removedChannels = createSelector(identity, i => Array.from(Object.values(i.removedChannels)))

const shippingData = createSelector(data, d => d.shippingData)

const registrationStatus = createSelector(identity, i => i.registrationStatus)

export default {
  id,
  name,
  data,
  identity,
  address,

  loader,
  shippingData,
  signerPrivKey,
  signerPubKey,

  shieldingTax,

  addresses,

  removedChannels,
  onionAddress,
  registrationStatus,
  nickName
}
