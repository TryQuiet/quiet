import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'

import channelsSelectors from '../selectors/channels'
import usersSelector from '../selectors/users'
import { messageType, getPublicKeysFromSignature } from '../../zbay/messages'
import { messages as zbayMessages } from '../../zbay'
import { getClient } from '../../zcash'

const _ReceivedUser = publicKey =>
  Immutable.Record(
    {
      [publicKey]: _UserData()
    },
    'ReceivedUser'
  )
const _UserData = Immutable.Record(
  {
    firstName: '',
    lastName: '',
    nickname: '',
    address: ''
  },
  'UserData'
)
export const ReceivedUser = (values, r) => {
  if (values === null) {
    return null
  }
  if (values.type === messageType.USER) {
    const publicKey = getPublicKeysFromSignature(values)[r].toString('hex')
    const record = _ReceivedUser(publicKey)()
    return record.set(publicKey, _UserData(values.message))
  }
}

export const initialState = Immutable.Map()

export const setUsers = createAction('SET_USERS')

export const actions = {
  setUsers
}

export const fetchUsers = () => async (dispatch, getState) => {
  const usersChannel = channelsSelectors.usersChannel(getState())
  const transfers = await getClient().payment.received(usersChannel.get('address'))

  const users = await transfers.reduce(
    async (acc = Promise.resolve(Immutable.Map({})), transfer) => {
      const accumulator = await acc
      const message = await zbayMessages.transferToMessage(transfer)
      return Promise.resolve(
        accumulator.merge(ReceivedUser(message, 0)).merge(ReceivedUser(message, 1))
      )
    },
    Promise.resolve(Immutable.Map({}))
  )

  dispatch(setUsers({ users }))
}

export const isNicknameTaken = (username) => async (dispatch, getState) => {
  const users = usersSelector.users(getState()).toJS()
  const userNames = Object.keys(users).map((key, index) => {
    return users[key].nickname
  })
  const uniqUsernames = R.uniq(userNames)
  return R.includes(username, uniqUsernames)
}

export const epics = {
  fetchUsers,
  isNicknameTaken
}

export const reducer = handleActions(
  {
    [setUsers]: (state, { payload: { users } }) => {
      return state.merge(users)
    }
  },
  initialState
)

export default {
  reducer,
  epics,
  actions
}
