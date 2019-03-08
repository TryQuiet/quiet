import Immutable from 'immutable'
import { handleActions } from 'redux-actions'

export const IdentityState = Immutable.Record({
  address: '',
  name: '',
  balance: 0
}, 'IdentityState')

export const initialState = IdentityState({
  address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
  name: 'Saturn',
  balance: '33.583004'
})

export const reducer = handleActions({
}, initialState)

export default {
  reducer
}
