import Immutable from 'immutable'
import * as R from 'ramda'
import { DateTime } from 'luxon'
import { createAction, handleActions } from 'redux-actions'

import channelSelectors from '../selectors/channel'

const messages = [
  {
    title: 'This is a basic message',
    spent: '0.2',
    type: 'basic',
    address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
    createdAt: DateTime.utc(2018, 12, 23, 22, 12).toISO(),
    description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
    id: 'thisisanotherhex'
  },
  {
    title: 'This is an add',
    spent: '2.0',
    type: 'ad',
    address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
    createdAt: DateTime.utc(2019, 2, 16, 23, 2).toISO(),
    description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
    price: '2.323288',
    qty: '2',
    id: 'thisisahex2'
  },
  {
    title: 'This is an add 2',
    spent: '21',
    type: 'ad',
    address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
    createdAt: DateTime.utc(2019, 3, 16, 23, 2).toISO(),
    description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
    price: '4.2349900',
    qty: '10',
    id: 'thisisahex1'
  },
  {
    title: 'This is a basic message',
    spent: '0.2',
    type: 'basic',
    address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
    createdAt: DateTime.utc(2019, 3, 18, 8, 31).toISO(),
    description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
    id: 'thisisanotherhex1'
  },
  {
    title: 'This is an add',
    spent: '2.0',
    type: 'ad',
    address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
    createdAt: DateTime.utc(2019, 3, 21, 14, 28).toISO(),
    description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
    price: '2.323288',
    qty: '2',
    id: 'thisisahex21'
  }
]

export const ChannelState = Immutable.Record({
  spentFilterValue: 0,
  name: '',
  members: null,
  message: '',
  messages: []
}, 'ChannelState')

export const initialState = ChannelState({ messages, name: 'Politics' })
const setSpentFilterValue = createAction('SET_SPENT_FILTER_VALUE', (_, value) => value)
const setMessage = createAction('SET_CHANNEL_MESSAGE', R.path(['target', 'value']))

const actions = {
  setSpentFilterValue,
  setMessage
}

const sendOnEnter = (event) => (dispatch, getState) => {
  const enterPressed = event.nativeEvent.keyCode === 13
  const shiftPressed = event.nativeEvent.shiftKey === true
  if (enterPressed && !shiftPressed) {
    event.preventDefault()
    console.log('sending', channelSelectors.message(getState()))
    dispatch(setMessage(''))
  }
}

const epics = {
  sendOnEnter
}

export const reducer = handleActions({
  [setSpentFilterValue]: (state, { payload: value }) => state.set('spentFilterValue', value),
  [setMessage]: (state, { payload: value }) => state.set('message', value)

}, initialState)

export default {
  reducer,
  epics,
  actions
}
