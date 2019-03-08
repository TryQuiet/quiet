import Immutable from 'immutable'
import { handleActions } from 'redux-actions'

export const RatesState = Immutable.Record({
  usd: '0',
  zec: '1'
}, 'RatesState')

export const initialState = RatesState({
  usd: '70.45230379033394',
  zec: '1'
})

export const reducer = handleActions({
}, initialState)

export default {
  reducer
}
