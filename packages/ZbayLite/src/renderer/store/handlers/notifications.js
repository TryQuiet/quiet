import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

export const initialState = Immutable.List()

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
  [enqueueSnackbar]: (state, { payload: notification }) => state.push(Immutable.fromJS(notification)),
  [removeSnackbar]: (state, { payload: key }) => state.filter(n => n.get('key') !== key)
}, initialState)

export default {
  actions,
  reducer
}
