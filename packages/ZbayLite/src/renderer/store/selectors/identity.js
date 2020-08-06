import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'

import { rate } from './rates'

const store = s => s

const identity = createSelector(store, state => state.get('identity'))

const data = createSelector(identity, i => i.data)

const balance = currency =>
  createSelector(data, rate(currency), (d, rate) =>
    rate.times(new BigNumber(d.balance || 0))
  )

const lockedBalance = currency =>
  createSelector(data, rate(currency), (d, rate) =>
    rate.times(new BigNumber(d.lockedBalance || 0))
  )

const id = createSelector(data, d => d.id)
const name = createSelector(data, d => d.name)

const donationAllow = createSelector(data, d => d.donationAllow)
const freeUtxos = createSelector(data, d => d.freeUtxos)
const shieldingTax = createSelector(data, d => d.shieldingTax)
const donationAddress = createSelector(data, d => d.donationAddress)

const donation = createSelector(data, d => ({
  allow: d.donationAllow,
  address: d.donationAddress
}))
const signerPrivKey = createSelector(data, d => d.signerPrivKey)
export const signerPubKey = createSelector(data, d => d.signerPubKey)

const address = createSelector(data, d => d.address)
const transparentAddress = createSelector(data, d => d.transparentAddress)
const topAddress = createSelector(
  data,
  d => d.addresses.get(0) || d.transparentAddress
)
const addresses = createSelector(data, d => d.addresses)
const topShieldedAddress = createSelector(
  data,
  d => d.shieldedAddresses.get(0) || d.address
)
const shieldedAddresses = createSelector(data, d => d.shieldedAddresses)

const loader = createSelector(identity, i => i.loader)

const removedChannels = createSelector(identity, i => i.removedChannels)

const shippingData = createSelector(data, d => d.shippingData)

export default {
  id,
  name,
  data,
  identity,
  address,
  transparentAddress,
  lockedBalance,
  balance,
  loader,
  shippingData,
  signerPrivKey,
  signerPubKey,
  donationAllow,
  donationAddress,
  donation,
  shieldingTax,
  freeUtxos,
  topAddress,
  topShieldedAddress,
  addresses,
  shieldedAddresses,
  removedChannels
}
