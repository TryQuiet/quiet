import { produce, immerable } from 'immer'
import { handleActions, createAction } from 'redux-actions'

import { actionTypes, PRICE_ORACLE_PUB_KEY } from '../../../shared/static'
import ratesSelectors from '../selectors/rates'
import { getPublicKeysFromSignature } from '../../zbay/messages'
import { trimNull } from '../../zbay/transit'
import electronStore from '../../../shared/electronStore'

import { ActionsType, PayloadType } from './types'

//TODO remove after changing in tests
export const RatesState = {
  usd: '0',
  zec: '1',
  history: {}
}
class Rates {
  usd: string;
  zec: string;
  history: {
    [key: string]: {
      datetime: number;
      price: string;
    }
  }

  constructor(values?: Partial<Rates>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: Rates = new Rates({
  usd: '70.45230379033394',
  zec: '1',
  history: {}
})

export const setPriceUsd = createAction<{ priceUsd: string }>(actionTypes.SET_PRICE_USD)
export const addPriceMessage = createAction<{
  messages: {
    [key: string]: {
      datetime: number;
      price: string;
    }
  }
}>(actionTypes.ADD_PRICE_MESSAGE)

export const actions = {
  setPriceUsd,
  addPriceMessage
}

export type RatesActions = ActionsType<typeof actions>

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
      } catch (err) {
        console.log('error', err)
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

export const reducer = handleActions<Rates, PayloadType<RatesActions>>(
  {
    [setPriceUsd.toString()]: (state, { payload: { priceUsd } }: RatesActions['setPriceUsd']) =>
      produce(state, draft => {
        draft.usd = priceUsd
      }),
    [addPriceMessage.toString()]: (
      state,
      { payload: { messages } }: RatesActions['addPriceMessage']
    ) =>
      produce(state, draft => {
        draft.history = {
          ...draft.history,
          ...messages
        }
      })
  },
  initialState
)

export default {
  reducer,
  actions,
  epics
}
