import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'

import { rate } from './rates'

import { Store } from '../reducers'

const identity = (s: Store) => s.identity

const data = createSelector(identity, i => i.data)

const balance = currency =>
  createSelector(data, rate(currency), (d, rate) => rate.times(new BigNumber(d.balance || 0)))

const lockedBalance = currency =>
  createSelector(data, rate(currency), (d, rate) => rate.times(new BigNumber(d.lockedBalance || 0)))

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
const onionAddress = createSelector(data, d => d.onionAddress)
const transparentAddress = createSelector(data, d => d.transparentAddress)
const topAddress = createSelector(data, d => d.addresses[0] || d.transparentAddress)
const addresses = createSelector(data, d => d.addresses)
const topShieldedAddress = createSelector(data, d => d.shieldedAddresses[0] || d.address)
const shieldedAddresses = createSelector(data, d => d.shieldedAddresses)

const loader = createSelector(identity, i => i.loader)

const removedChannels = createSelector(identity, i => Array.from(Object.values(i.removedChannels)))

const shippingData = createSelector(data, d => d.shippingData)

const registrationStatus = createSelector(identity, i => i.registrationStatus)
const certificate = createSelector(data, d => d.certificate)

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
  removedChannels,
  onionAddress,
  registrationStatus,
  certificate
}
