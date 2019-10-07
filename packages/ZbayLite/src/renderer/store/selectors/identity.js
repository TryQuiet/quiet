import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import * as R from 'ramda'

import { rate } from './rates'
import operationsSelectors from './operations'
import { operationTypes } from '../handlers/operations'

const store = s => s

const identity = createSelector(store, state => state.get('identity'))

const data = createSelector(identity, i => i.data)

const balance = currency => createSelector(
  data,
  rate(currency),
  (d, rate) => rate.times(new BigNumber(d.balance || 0))
)

const lockedBalance = currency => createSelector(
  data,
  rate(currency),
  (d, rate) => rate.times(new BigNumber(d.lockedBalance || 0))
)

const id = createSelector(data, d => d.id)
const name = createSelector(data, d => d.name)

const donationAllow = createSelector(data, d => d.donationAllow)
const donationAddress = createSelector(data, d => d.donationAddress)

const donation = createSelector(data, d => ({ allow: d.donationAllow, address: d.donationAddress }))
const signerPrivKey = createSelector(data, d => d.signerPrivKey)
const signerPubKey = createSelector(data, d => d.signerPubKey)

const address = createSelector(data, d => d.address)
const transparentAddress = createSelector(data, d => d.transparentAddress)

const _isShieldOperation = R.curry((identity, op) => {
  return (
    op.type === operationTypes.shieldBalance &&
      op.meta.from === identity.transparentAddress &&
      op.meta.to === identity.address
  )
})

const transparentBalance = createSelector(
  data,
  operationsSelectors.operations,
  (d, ops) => R.compose(
    R.reduce((acc, [key, val]) => acc.plus(val.meta.amount), new BigNumber(0)),
    o => o.filter(_isShieldOperation(d))
  )(ops)
)

const loader = createSelector(identity, i => i.loader)

const shippingData = createSelector(data, d => d.shippingData)

export default {
  id,
  name,
  data,
  identity,
  address,
  transparentAddress,
  transparentBalance,
  lockedBalance,
  balance,
  loader,
  shippingData,
  signerPrivKey,
  signerPubKey,
  donationAllow,
  donationAddress,
  donation
}
