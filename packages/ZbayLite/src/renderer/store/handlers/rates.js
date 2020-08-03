import Immutable from 'immutable'
import { handleActions, createAction } from 'redux-actions'

import { actionTypes, PRICE_ORACLE_PUB_KEY } from '../../../shared/static'
import { checkTransferCount } from './messages'
import ratesSelectors from '../selectors/rates'
import { getPublicKeysFromSignature } from '../../zbay/messages'
import { trimNull } from '../../zbay/transit'
import electronStore from '../../../shared/electronStore'

export const RatesState = Immutable.Record(
  {
    usd: '0',
    zec: '1',
    history: Immutable.Map({})
  },
  'RatesState'
)
export const initialState = RatesState({
  usd: '70.45230379033394',
  zec: '1',
  history: Immutable.Map({})
})
export const setPriceUsd = createAction(actionTypes.SET_PRICE_USD)
export const addPriceMessage = createAction(actionTypes.ADD_PRICE_MESSAGE)
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
export const fetchPrices = (address, messages) => async (
  dispatch,
  getState
) => {
  try {
    const transferCountFlag = await dispatch(
      checkTransferCount(address, messages)
    )
    if (transferCountFlag === -1 || !messages) {
      return
    }
    for (const msg of messages) {
      try {
        const memo = trimNull(Buffer.from(msg.memohex, 'hex').toString())
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
        dispatch(
          addPriceMessage({
            messages: { [msg.txid]: { datetime: msg.datetime, price: price } }
          })
        )
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
    return ratesSelectors.priceByTime(time)(getState())
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
      state.set('usd', priceUsd),
    [addPriceMessage]: (state, { payload: { messages } }) =>
      state.update('history', s => s.merge(messages))
  },
  initialState
)

export default {
  reducer,
  actions,
  epics
}
