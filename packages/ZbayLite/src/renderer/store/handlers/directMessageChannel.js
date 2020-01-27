import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

export const DirectMessageChannelState = Immutable.Record(
  {
    targetRecipientAddress: null,
    targetRecipientUsername: null
  },
  'DirectMessageChannelState'
)

export const initialState = DirectMessageChannelState()

const setDirectMessageRecipientUsername = createAction(actionTypes.SET_DIRECT_MESSAGE_RECIPIENT_USERNAME)
const setDirectMessageRecipientAddress = createAction(actionTypes.SET_DIRECT_MESSAGE_RECIPIENT_ADDRESS)
const resetDirectMessageChannel = createAction(actionTypes.RESET_DIRECT_MESSAGE_CHANNEL)

export const actions = {
  setDirectMessageRecipientAddress,
  setDirectMessageRecipientUsername,
  resetDirectMessageChannel
}

export const reducer = handleActions(
  {
    [setDirectMessageRecipientAddress]: (state, { payload: id }) =>
      state.set('targetRecipientAddress', id),
    [setDirectMessageRecipientUsername]: (state, { payload: username }) =>
      state.set('targetRecipientUsername', username),
    [resetDirectMessageChannel]: () => initialState
  },
  initialState
)

export default {
  reducer,
  actions
}
