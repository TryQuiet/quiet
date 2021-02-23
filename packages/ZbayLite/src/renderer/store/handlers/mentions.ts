import { produce, immerable } from 'immer'
import { DateTime } from 'luxon'
import { createAction, handleActions } from 'redux-actions'

import channelSelectors from '../selectors/channel'
import publicChannelsSelector from '../selectors/publicChannels'
import usersSelectors from '../selectors/users'
import mentionsSelectors from '../selectors/mentions'
import { actionTypes } from '../../../shared/static'
import { messages as zbayMessages } from '../../zbay'
import identitySelectors from '../selectors/identity'
import directMessagesQueueHandlers from './directMessagesQueue'
import notificationsHandlers from './notifications'
import modalsHandlers from './modals'
import { errorNotification, successNotification } from './utils'

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
  const message = channelSelectors.message(getState())
  const members = channelSelectors.members(getState())
  const users = usersSelectors.users(getState())
  const currentMentions = mentionsSelectors.mentionForChannel(channelId)(getState())

  const usersOnChannel = Array.from(Object.values(users)).filter(user => members.has(user.address))
  const splitMessage = message
    .split(String.fromCharCode(160))
    .filter(part => part.startsWith('@'))
    .filter(part =>
      Array.from(Object.values(users)).find(user => user.nickname === part.substring(1))
    )

  const foundMentions = []
  for (const mention of splitMessage) {
    if (!usersOnChannel.find(user => user.nickname === mention.substring(1).trim())) {
      if (!currentMentions.find(c => c.nickname === mention.substring(1).trim())) {
        foundMentions.push(
          new Mentions({
            nickname: mention.substring(1).trim(),
            timeStamp: DateTime.utc().toSeconds()
          })
        )
      }
    }
  }
  if (foundMentions.length > 0) {
    dispatch(addMentionMiss({ mentions: foundMentions.concat(currentMentions), channelId }))
  }
}
const removeMention = nickname => async (dispatch, getState) => {
  const channelId = channelSelectors.channelId(getState())
  dispatch(removeMentionMiss({ channelId, nickname }))
}

const sendInvitation = nickname => async (dispatch, getState) => {
  try {
    const channelId = channelSelectors.channelId(getState())
    const channelAddress = channelSelectors.data(getState()).address
    const privKey = identitySelectors.signerPrivKey(getState())
    const users = usersSelectors.users(getState())
    const publicChannel = Array.from(
      Object.values(publicChannelsSelector.publicChannels(getState()))
    ).find(ch => ch.address === channelAddress)
    if (!publicChannel) {
      dispatch(modalsHandlers.actionCreators.openModal('channelInfo')())
      dispatch(removeMentionMiss({ channelId, nickname }))

      return
    }
    const targetUser = Array.from(Object.values(users)).find(user => user.nickname === nickname)
    const message = zbayMessages.createMessage({
      messageData: {
        type: zbayMessages.messageType.BASIC,
        data: `Please join #${publicChannel.name}`
      },
      privKey
    })
    dispatch(
      directMessagesQueueHandlers.epics.addDirectMessage({
        message,
        recipientAddress: targetUser.address,
        recipientUsername: targetUser.nickname
      })
    )
    dispatch(removeMentionMiss({ channelId, nickname }))
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({ message: 'Invitation sent' })
      )
    )
  } catch (err) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({ message: 'Failed to send invitation ' })
      )
    )
  }
}

export const epics = {
  checkMentions,
  removeMention,
  sendInvitation
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
        draft[channelId] = {
          ...draft[channelId],
          ...mentions
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
