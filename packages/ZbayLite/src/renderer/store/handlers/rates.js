import Immutable from 'immutable'
import { handleActions, createAction } from 'redux-actions'
import Binance from 'binance-api-node'

import { actionTypes } from '../../../shared/static'

export const client = Binance()

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
    const zecPrice = await client.avgPrice({ symbol: 'ZECUSDT' })
    dispatch(setPriceUsd({ priceUsd: zecPrice.price }))
  } catch (err) {
    console.warn(err)
  }
}
export const epics = {
  fetchPrices
}

export const reducer = handleActions(
  {
    [setPriceUsd]: (state, { payload: { priceUsd } }) => state.set('usd', priceUsd)
  },
  initialState
)

export default {
  reducer,
  actions,
  epics
}
