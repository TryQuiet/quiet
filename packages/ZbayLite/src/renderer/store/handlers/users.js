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

const usersNicknames = new Set()

export const ReceivedUser = (values, registeredUsers) => {
  if (values === null) {
    return null
  }
  if (values.type === messageType.USER) {
    const publicKey0 = getPublicKeysFromSignature(values)[0].toString('hex')
    const publicKey1 = getPublicKeysFromSignature(values)[1].toString('hex')
    const record0 = _ReceivedUser(publicKey0)()
    const record1 = _ReceivedUser(publicKey1)()
    if (
      usersNicknames.has(values.message.nickname) &&
      registeredUsers.get(publicKey0) === undefined
    ) {
      let i = 2
      while (usersNicknames.has(`${values.message.nickname} #${i}`)) {
        i++
      }
      usersNicknames.add(`${values.message.nickname} #${i}`)
      return [
        record0.set(
          publicKey0,
          _UserData({ ...values.message, nickname: `${values.message.nickname} #${i}` })
        ),
        record1.set(
          publicKey1,
          _UserData({ ...values.message, nickname: `${values.message.nickname} #${i}` })
        )
      ]
    }
    usersNicknames.add(values.message.nickname)
    return [
      record0.set(publicKey0, _UserData(values.message)),
      record1.set(publicKey1, _UserData(values.message))
    ]
  }
  return null
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
      const user = ReceivedUser(message, accumulator)

      if (user === null) {
        return Promise.resolve(accumulator)
      }

      return Promise.resolve(accumulator.merge(user[0]).merge(user[1]))
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
