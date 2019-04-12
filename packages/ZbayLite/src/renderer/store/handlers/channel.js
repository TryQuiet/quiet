import Immutable from 'immutable'
import * as R from 'ramda'
import { createAction, handleActions } from 'redux-actions'
import channelSelectors from '../selectors/channel'
import { getClient } from '../../zcash'
import { messages } from '../../zbay'

import { typeFulfilled, typeRejected, typePending } from './utils'

export const MessagesState = Immutable.Record({
  loading: false,
  data: Immutable.List(),
  errors: '',
  page: 1
})

export const ChannelState = Immutable.Record({
  spentFilterValue: 0,
  id: null,
  message: '',
  messages: MessagesState(),
  members: null
}, 'ChannelState')

export const initialState = ChannelState()

const setSpentFilterValue = createAction('SET_SPENT_FILTER_VALUE', (_, value) => value)
const setMessage = createAction('SET_CHANNEL_MESSAGE', R.path(['target', 'value']))
const setChannelId = createAction('SET_CHANNEL_ID')
const loadMessages = createAction(
  'LOAD_CHANNEL_MESSAGES',
  async (channelAddress, page = 1) => {
    const transfers = await getClient().payment.received(channelAddress)
    return {
      messages: await messages.transfersToMessages(transfers),
      page
    }
  }
)

const actions = {
  setSpentFilterValue,
  setMessage
}

// TODO: write tests for load channel
// TODO: maybe we can skip channel alltogether
const loadChannel = (id) => async (dispatch, getState) => {
  dispatch(setChannelId(id))
  const channel = channelSelectors.data(getState())
  await dispatch(loadMessages(channel.get('address')))
}

const sendOnEnter = (event) => (dispatch, getState) => {
  const enterPressed = event.nativeEvent.keyCode === 13
  const shiftPressed = event.nativeEvent.shiftKey === true
  if (enterPressed && !shiftPressed) {
    event.preventDefault()
    dispatch(setMessage(''))
  }
}

const epics = {
  sendOnEnter,
  loadChannel
}

export const reducer = handleActions({
  [setSpentFilterValue]: (state, { payload: value }) => state.set('spentFilterValue', value),
  [setMessage]: (state, { payload: value }) => state.set('message', value),
  [setChannelId]: (state, { payload: id }) => state.set('id', id),

  [typeFulfilled(loadMessages)]: (state, { payload: { messages, page } }) => state.update(
    'messages',
    msgMeta => msgMeta
      .set('data', Immutable.fromJS(messages))
      .set('page', page)
      .set('loading', false)
  ),
  [typePending(loadMessages)]: (state) => state.update('messages', msgs => msgs.set('loading', true)),
  [typeRejected(loadMessages)]: (state, { payload: error }) => state.update(
    'messages',
    msgs => msgs.set('loading', true)
      .set('errors', error.message)
  )
}, initialState)

export default {
  reducer,
  epics,
  actions
}
