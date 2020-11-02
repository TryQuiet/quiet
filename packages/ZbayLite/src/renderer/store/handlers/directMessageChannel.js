import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

export const DirectMessageChannelState = {
  targetRecipientAddress: null,
  targetRecipientUsername: null
}

export const initialState = {
  ...DirectMessageChannelState
}

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
    [setDirectMessageRecipientAddress]: (state, { payload: id }) => produce(state, (draft) => {
      draft.targetRecipientAddress = id
    }),
    [setDirectMessageRecipientUsername]: (state, { payload: username }) => produce(state, (draft) => {
      draft.targetRecipientUsername = username
    }),
    [resetDirectMessageChannel]: (state) => produce(state, (draft) => {
      draft.targetRecipientAddress = null
      draft.targetRecipientUsername = null
    })
  },
  initialState
)

export default {
  reducer,
  actions
}
