import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'

import channelSelectors from '../selectors/channel'
import { actionTypes } from '../../../shared/static'

import { ActionsType, PayloadType } from './types'

// TODO: remove after changing in tests
export const ChannelMentions = {
  nickname: '',
  timeStamp: 0
}

class Mentions {
  nickname?: string
  timeStamp?: number

  constructor(values?: Partial<Mentions>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: Mentions = {}

const addMentionMiss = createAction(actionTypes.ADD_MENTION_MISS)
const clearMentionMiss = createAction(actionTypes.CLEAR_MENTION_MISS)
const removeMentionMiss = createAction(actionTypes.REMOVE_MENTION_MISS)

export const actions = {
  addMentionMiss,
  clearMentionMiss,
  removeMentionMiss
}

export type MentionsActions = ActionsType<typeof actions>

const checkMentions = () => async (dispatch, getState) => {
  const channelId = channelSelectors.channelId(getState())
  // const message = channelSelectors.message(getState())

  // const users = usersSelectors.users(getState())
  // const currentMentions = mentionsSelectors.mentionForChannel(channelId)(getState())

  // const splitMessage = message
  //   .split(String.fromCharCode(160))
  //   .filter(part => part.startsWith('@'))
  //   .filter(part =>
  //     Array.from(Object.values(users)).find(user => user.nickname === part.substring(1))
  //   )

  const foundMentions = []
  // for (const mention of splitMessage) {
  //   if (!usersOnChannel.find(user => user.nickname === mention.substring(1).trim())) {
  //     if (!currentMentions.find(c => c.nickname === mention.substring(1).trim())) {
  //       foundMentions.push(
  //         new Mentions({
  //           nickname: mention.substring(1).trim(),
  //           timeStamp: DateTime.utc().toSeconds()
  //         })
  //       )
  //     }
  //   }
  // }
  if (foundMentions.length > 0) {
    dispatch(addMentionMiss({ mentions: foundMentions, channelId }))
  }
}
const removeMention = nickname => async (dispatch, getState) => {
  const channelId = channelSelectors.channelId(getState())
  dispatch(removeMentionMiss({ channelId, nickname }))
}

export const epics = {
  checkMentions,
  removeMention
}
export const reducer = handleActions<Mentions, PayloadType<MentionsActions>>(
  {
    [clearMentionMiss.toString()]: state =>
      produce(state, () => {
        return {
          ...initialState
        }
      }),
    [removeMentionMiss.toString()]: (state, { payload: { channelId, nickname } }) =>
      produce(state, draft => {
        draft[channelId] = draft[channelId].filter(mention => mention.nickname !== nickname)
      }),
    [addMentionMiss.toString()]: (state, { payload: { mentions, channelId } }) =>
      produce(state, draft => {
        if (!draft[channelId]) {
          draft[channelId] = [...mentions]
        } else {
          draft[channelId] = [...draft[channelId], ...mentions]
        }
      })
  },
  initialState
)

export default {
  actions,
  reducer,
  epics
}
