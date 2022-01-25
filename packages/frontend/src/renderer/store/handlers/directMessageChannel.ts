import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

import { ActionsType, PayloadType } from './types'

class DirectMessageChannel {
  targetRecipientAddress?: string
  targetRecipientUsername?: string

  constructor(values?: Partial<DirectMessageChannel>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: DirectMessageChannel = {
  ...new DirectMessageChannel()
}

const setDirectMessageRecipientUsername = createAction<string>(actionTypes.SET_DIRECT_MESSAGE_RECIPIENT_USERNAME)
const setDirectMessageRecipientAddress = createAction<string>(actionTypes.SET_DIRECT_MESSAGE_RECIPIENT_ADDRESS)
const resetDirectMessageChannel = createAction(actionTypes.RESET_DIRECT_MESSAGE_CHANNEL)

export const actions = {
  setDirectMessageRecipientAddress,
  setDirectMessageRecipientUsername,
  resetDirectMessageChannel
}

export type DirectMessageChannelActions = ActionsType<typeof actions>

export const reducer = handleActions<
DirectMessageChannel,
PayloadType<DirectMessageChannelActions>
>(
  {
    [setDirectMessageRecipientAddress.toString()]: (
      state,
      { payload: id }: DirectMessageChannelActions['setDirectMessageRecipientAddress']
    ) =>
      produce(state, draft => {
        draft.targetRecipientAddress = id
      }),
    [setDirectMessageRecipientUsername.toString()]: (
      state,
      { payload: username }: DirectMessageChannelActions['setDirectMessageRecipientUsername']
    ) =>
      produce(state, draft => {
        draft.targetRecipientUsername = username
      }),
    [resetDirectMessageChannel.toString()]: state =>
      produce(state, draft => {
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
