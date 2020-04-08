import Immutable from 'immutable'
import { handleActions, createAction } from 'redux-actions'

import { actionTypes } from '../../../shared/static'
import channelsSelectors from '../selectors/channels'
import { getClient } from '../../zcash'
import appSelectors from '../selectors/app'
import appHandlers from './app'
import txnTimestampsHandlers from '../handlers/txnTimestamps'
import txnTimestampsSelector from '../selectors/txnTimestamps'
import { getVault } from '../../vault'

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
    const price = parseFloat(
      Buffer.from(sortedTransfers[0].memo, 'hex').toString()
    )
    dispatch(setPriceUsd({ priceUsd: price }))
  } catch (err) {
    console.warn(err)
  }
}
export const epics = {
  fetchPrices
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
