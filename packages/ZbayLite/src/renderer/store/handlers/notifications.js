import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

export const initialState = []

const enqueueSnackbar = createAction(
  actionTypes.ENQUEUE_SNACKBAR,
  n => ({
    key: new Date().getTime() + Math.random(),
    ...n
  })
)
const removeSnackbar = createAction(actionTypes.REMOVE_SNACKBAR)

export const actions = {
  enqueueSnackbar,
  removeSnackbar
}

// TODO: [refactoring] rewrite rest of the notifications to use Notifier
export const reducer = handleActions({
  [enqueueSnackbar]: (state, { payload: notification }) => {
    console.log('test', notification)
    return produce(state, (draft) => {
      draft.push(notification)
    })
  },
  [removeSnackbar]: (state, { payload: key }) => produce(state, (draft) => draft.filter(n => n.key !== key))
}, initialState)

export default {
  actions,
  reducer
}
