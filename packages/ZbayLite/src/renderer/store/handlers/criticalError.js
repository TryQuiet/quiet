import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

export const CriticalError = {
  message: '',
  traceback: ''
}

export const initialState = {
  ...CriticalError
}

const setCriticalError = createAction(actionTypes.SET_CRITICAL_ERROR)

export const actions = {
  setCriticalError
}

export const reducer = handleActions({
  [setCriticalError]: (state, { payload: error }) => produce(state, (draft) => {
    return {
      ...draft,
      ...error
    }
  })
}, initialState)

export default {
  actions,
  reducer
}
