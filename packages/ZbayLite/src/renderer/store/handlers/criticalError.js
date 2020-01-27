import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

export const CriticalError = Immutable.Record({
  message: '',
  traceback: ''
}, 'CriticalError')

export const initialState = CriticalError()

const setCriticalError = createAction(actionTypes.SET_CRITICAL_ERROR)

export const actions = {
  setCriticalError
}

export const reducer = handleActions({
  [setCriticalError]: (state, { payload: error }) => state.merge(error)
}, initialState)

export default {
  actions,
  reducer
}
