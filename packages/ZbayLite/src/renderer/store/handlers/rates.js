import Immutable from 'immutable'
import { handleActions, createAction } from 'redux-actions'

import { actionTypes, PRICE_ORACLE_PUB_KEY } from '../../../shared/static'
import channelsSelectors from '../selectors/channels'
import { getClient } from '../../zcash'
import appSelectors from '../selectors/app'
import appHandlers from './app'
import txnTimestampsHandlers from '../handlers/txnTimestamps'
import txnTimestampsSelector from '../selectors/txnTimestamps'
import { getPublicKeysFromSignature } from '../../zbay/messages'
import { trimNull } from '../../zbay/transit'
import { getVault } from '../../vault'
import electronStore from '../../../shared/electronStore'

export const RatesState = Immutable.Record(
  {
    usd: '0',
    zec: '1'
  },
  'RatesState'
)
export const initialState = RatesState({
  usd: '70.45230379033394',
  zec: '1'
})
export const setPriceUsd = createAction(actionTypes.SET_PRICE_USD)
export const actions = {
  setPriceUsd
}
export const setInitialPrice = () => async (dispatch, getState) => {
  try {
    const price = electronStore.get('rates.usd')
    if (price) {
      dispatch(setPriceUsd({ priceUsd: price }))
    }
  } catch (err) {
    console.log(err)
  }
}
export const fetchPrices = () => async (dispatch, getState) => {
  try {
    const channel = channelsSelectors.priceOracleChannel(getState())
    let txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())
    const transfers = await getClient().payment.received(channel.get('address'))
    if (
      transfers.length ===
      appSelectors.transfers(getState()).get(channel.get('address'))
    ) {
      return
    } else {
      dispatch(
        appHandlers.actions.setTransfers({
          id: channel.get('address'),
          value: transfers.length
        })
      )
    }
    for (const key in transfers) {
      const transfer = transfers[key]
      if (!txnTimestamps.get(transfer.txid)) {
        const result = await getClient().confirmations.getResult(transfer.txid)
        await getVault().transactionsTimestamps.addTransaction(
          transfer.txid,
          result.timereceived
        )
        await dispatch(
          txnTimestampsHandlers.actions.addTxnTimestamp({
            tnxs: { [transfer.txid]: result.timereceived.toString() }
          })
        )
      }
    }
    txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())
    const sortedTransfers = transfers.sort(
      (b, a) => txnTimestamps.get(a.txid) - txnTimestamps.get(b.txid)
    )
    for (const msg of sortedTransfers) {
      try {
        const memo = trimNull(Buffer.from(msg.memo, 'hex').toString())
        const price = trimNull(memo.substring(129))
        const pkey = getPublicKeysFromSignature({
          message: price,
          signature: Buffer.from(memo.substring(0, 128), 'hex'),
          r: parseInt(memo.substring(128, 129))
        })
        if (pkey.toString('hex') !== PRICE_ORACLE_PUB_KEY) {
          continue
        }
        dispatch(setPriceUsd({ priceUsd: price }))
        electronStore.set('rates.usd', price)
        break
      } catch (err) {
        continue
      }
    }
  } catch (err) {
    console.warn(err)
  }
}
export const fetchPriceForTime = time => async (dispatch, getState) => {
  try {
    const channel = channelsSelectors.priceOracleChannel(getState())
    let txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())
    const transfers = await getClient().payment.received(channel.get('address'))
    for (const key in transfers) {
      const transfer = transfers[key]
      if (!txnTimestamps.get(transfer.txid)) {
        const result = await getClient().confirmations.getResult(transfer.txid)
        await getVault().transactionsTimestamps.addTransaction(
          transfer.txid,
          result.timereceived
        )
        await dispatch(
          txnTimestampsHandlers.actions.addTxnTimestamp({
            tnxs: { [transfer.txid]: result.timereceived.toString() }
          })
        )
      }
    }
    txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())
    const closesTransaction = transfers
      .map(txn => txn.txid)
      .reduce((prev, curr) => {
        return Math.abs(parseInt(txnTimestamps.get(curr)) - time) <
          Math.abs(parseInt(txnTimestamps.get(prev)) - time)
          ? curr
          : prev
      })
    const txn = transfers.find(txn => txn.txid === closesTransaction)
    return parseFloat(Buffer.from(txn.memo, 'hex').toString())
  } catch (err) {
    console.warn(err)
  }
}
export const epics = {
  fetchPrices,
  fetchPriceForTime,
  setInitialPrice
}

export const reducer = handleActions(
  {
    [setPriceUsd]: (state, { payload: { priceUsd } }) =>
      state.set('usd', priceUsd)
  },
  initialState
)

export default {
  reducer,
  actions,
  epics
}
