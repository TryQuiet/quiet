import Immutable from 'immutable'
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

export const ChannelMentions = Immutable.Record(
  {
    nickname: '',
    timeStamp: 0
  },
  'ChannelMentions'
)

export const initialState = Immutable.Map()

const addMentionMiss = createAction(actionTypes.ADD_MENTION_MISS)
const clearMentionMiss = createAction(actionTypes.CLEAR_MENTION_MISS)
const removeMentionMiss = createAction(actionTypes.REMOVE_MENTION_MISS)

export const actions = {
  addMentionMiss,
  clearMentionMiss,
  removeMentionMiss
}
const checkMentions = () => async (dispatch, getState) => {
  const channelId = channelSelectors.channelId(getState())
  const message = channelSelectors.message(getState())
  const members = channelSelectors.members(getState())
  const users = usersSelectors.users(getState())

  const currentMentions = mentionsSelectors.mentionForChannel(channelId)(
    getState()
  )

  const usersOnChannel = users
    .toList()
    .filter(user => members.has(user.address))
  const splitMessage = message
    .split(String.fromCharCode(160))
    .filter(part => part.startsWith('@'))
    .filter(part => users.toList().find(user => user.nickname === part.substring(1)))

  const foundMentions = []
  for (const mention of splitMessage) {
    if (
      !usersOnChannel.find(
        user => user.nickname === mention.substring(1).trim()
      )
    ) {
      if (
        !currentMentions.find(c => c.nickname === mention.substring(1).trim())
      ) {
        foundMentions.push(
          ChannelMentions({
            nickname: mention.substring(1).trim(),
            timeStamp: DateTime.utc().toSeconds()
          })
        )
      }
    }
  }
  if (foundMentions.length > 0) {
    dispatch(
      addMentionMiss({ [channelId]: foundMentions.concat(currentMentions) })
    )
  }
}
const removeMention = nickname => async (dispatch, getState) => {
  const channelId = channelSelectors.channelId(getState())
  dispatch(removeMentionMiss({ channelId, nickname }))
}

const sendInvitation = nickname => async (dispatch, getState) => {
  try {
    const channelId = channelSelectors.channelId(getState())
    const channelAddress = channelSelectors.data(getState()).get('address')
    const privKey = identitySelectors.signerPrivKey(getState())
    const users = usersSelectors.users(getState())
    const publicChannel = publicChannelsSelector
      .publicChannels(getState())
      .find(ch => ch.address === channelAddress)
    if (!publicChannel) {
      dispatch(modalsHandlers.actionCreators.openModal('channelInfo')())
      dispatch(removeMentionMiss({ channelId, nickname }))

      return
    }
    const targetUser = users.toList().find(user => user.nickname === nickname)
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
        successNotification({ message: `Invitation sent` })
      )
    )
  } catch (err) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({ message: `Failed to send invitation ` })
      )
    )
  }
}

export const epics = {
  checkMentions,
  removeMention,
  sendInvitation
}
export const reducer = handleActions(
  {
    [clearMentionMiss]: () => initialState,
    [removeMentionMiss]: (state, { payload: { channelId, nickname } }) =>
      state.updateIn([channelId], mentions =>
        mentions.filter(mention => mention.nickname !== nickname)
      ),
    [addMentionMiss]: (state, { payload: channel }) => state.merge(channel)
  },
  initialState
)

export default {
  actions,
  reducer,
  epics
}
