import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

import {ActionsType, PayloadType} from './types'

class CriticalError {
  message: string;
  traceback: string

  constructor(values?: Partial<CriticalError>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: CriticalError = {
  ...new CriticalError({
    message: '',
    traceback: ''
  })
}


const setCriticalError = createAction<{message: string; traceback: string}>(actionTypes.SET_CRITICAL_ERROR)

export const actions = {
  setCriticalError
}

export type CriticalErrorActions = ActionsType<typeof actions>

export const reducer = handleActions<CriticalError, PayloadType<CriticalErrorActions>>(
  {
    [setCriticalError.toString()]: (
      state,
      { payload: error }: CriticalErrorActions['setCriticalError']
    ) =>
      produce(state, draft => {
        return {
          ...draft,
          ...error
        }
      })
  },
  initialState
)

export default {
  actions,
  reducer
}
