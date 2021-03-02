import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'
import { ipcRenderer } from 'electron'

import axios from 'axios'

import nodeSelectors from '../selectors/node'
import feesHandlers from './fees'
import appHandlers from './app'
import { actionCreators } from './modals'
import usersSelector from '../selectors/users'
import identitySelector from '../selectors/identity'
import { actions as identityActions } from '../handlers/identity'
import appSelectors from '../selectors/app'
import { getPublicKeysFromSignature } from '../../zbay/messages'
import {
  messageType,
  actionTypes,
  unknownUserId,
  REQUEST_USER_REGISTRATION_ENDPOINT,
} from '../../../shared/static'
import { messages as zbayMessages } from '../../zbay'
import staticChannels from '../../zcash/channels'
import notificationsHandlers from './notifications'
import { successNotification, errorNotification } from './utils'
import electronStore from '../../../shared/electronStore'

import { DisplayableMessage } from '../../zbay/messages.types'

import { packMemo } from '../../zbay/transit'

import { ActionsType, PayloadType } from './types'

// TODO: to remove, but first replace in tests
export const _UserData = {
  firstName: '',
  publicKey: '',
  lastName: '',
  nickname: '',
  address: '',
  onionAddress: '',
  createdAt: 0
}

const _ReceivedUser = publicKey => ({
  [publicKey]: {
    ...new User()
  }
})

const usersNicknames = new Map()

export const ReceivedUser = values => {
  if (values === null || ![0, 1].includes(values.r)) {
    return null
  }
  if (values.type === messageType.USER) {
    const publicKey0 = getPublicKeysFromSignature(values).toString('hex')
    for (const i of usersNicknames.keys()) {
      if (usersNicknames.get(i) === publicKey0) usersNicknames.delete(i)
    }
    let record0 = _ReceivedUser(publicKey0)
    if (
      usersNicknames.get(values.message.nickname) &&
      usersNicknames.get(values.message.nickname) !== publicKey0
    ) {
      let i = 2
      while (usersNicknames.get(`${values.message.nickname} #${i}`)) {
        i++
      }
      usersNicknames.set(`${values.message.nickname} #${i}`, publicKey0)
      record0 = {
        ...record0,
        [publicKey0]: {
          ...new User({
            ...values.message,
            nickname: `${values.message.nickname} #${i}`,
            createdAt: values.createdAt,
            publicKey: values.publicKey
          })
        }
      }
      return record0
    } else {
      usersNicknames.set(values.message.nickname, publicKey0)
    }
    record0 = {
      ...record0,
      [publicKey0]: {
        ...new User({
          ...values.message,
          createdAt: values.createdAt,
          publicKey: values.publicKey
        })
      }
    }
    return record0
  }
  return null
}
export class User {
  key?: string
  firstName: string = ''
  publicKey: string = ''
  lastName: string = ''
  nickname: string = ''
  address: string = ''
  onionAddress: string = ''
  createdAt: number = 0

  constructor(values?: Partial<User>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export interface UsersStore {
  [key: string]: User
}

export const initialState: UsersStore = {}

export const setUsers = createAction<{ users: { [key: string]: User } }>(actionTypes.SET_USERS)
export const addUnknownUser = createAction(actionTypes.ADD_UNKNOWN_USER)
export const mockOwnUser = createAction<{ sigPubKey: string; nickname: string; address: string }>(
  actionTypes.MOCK_OWN_USER
)

export const actions = {
  setUsers,
  addUnknownUser,
  mockOwnUser
}

export type UserActions = ActionsType<typeof actions>

export const registerAnonUsername = () => async (dispatch, getState) => {
  const publicKey = identitySelector.signerPubKey(getState())
  await dispatch(createOrUpdateUser({ nickname: `anon${publicKey.substring(0, 10)}` }))
}

export const createOrUpdateUser = (payload: {
  nickname: string
  firstName?: string
  lastName?: string
  debounce?: boolean
  retry?: number
}) => async (dispatch, getState) => {
  const { nickname, firstName = '', lastName = '' } = payload
  const publicKey = identitySelector.signerPubKey(getState())
  const address = identitySelector.address(getState())
  const privKey = identitySelector.signerPrivKey(getState())
  const messageData = {
    firstName,
    lastName,
    nickname,
    address
  }

  const registrationMessage = zbayMessages.createMessage({
    messageData: {
      type: zbayMessages.messageType.USER,
      data: messageData
    },
    privKey
  })
  dispatch(actionCreators.closeModal('accountSettingsModal')())
  const onionAddress = identitySelector.onionAddress(getState())
  const messageDataTor = {
    onionAddress: onionAddress.substring(0, 56)
  }
  const registrationMessageTor = zbayMessages.createMessage({
    messageData: {
      type: zbayMessages.messageType.USER_V2,
      data: messageDataTor
    },
    privKey
  })

  const userMemo = await packMemo(registrationMessage)
  const torMemo = await packMemo(registrationMessageTor)

  try {
    await axios.get(REQUEST_USER_REGISTRATION_ENDPOINT, {
      params: {
        userMemo: userMemo,
        torMemo: torMemo,
        nickname: nickname,
        publicKey: publicKey
      }
    })
  } catch (error) {
    console.log('error')
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: 'Registration failed, try again in few minutes'
        })
      )
    )
    dispatch(
      identityActions.setRegistraionStatus({
        nickname,
        status: 'ERROR'
      })
    )
    dispatch(actionCreators.openModal('failedUsernameRegister')())
    return
  }

  try {
    dispatch(
      identityActions.setRegistraionStatus({
        nickname,
        status: 'IN_PROGRESS'
      })
    )
    dispatch(
      mockOwnUser({
        sigPubKey: publicKey,
        address,
        nickname
      })
    )
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({
          message: 'Registering username—this can take a few minutes.'
        })
      )
    )
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({
          message: 'Your onion address will be public in few minutes'
        })
      )
    )
    dispatch(notificationsHandlers.actions.removeSnackbar('username'))
  } catch (err) {
    console.log(err)
    dispatch(
      identityActions.setRegistraionStatus({
        nickname,
        status: 'ERROR'
      })
    )
    dispatch(actionCreators.openModal('failedUsernameRegister')())
  }
}
export const registerOnionAddress = torStatus => async (dispatch, getState) => {
  const useTor = appSelectors.useTor(getState())
  if (useTor === torStatus) {
    return
  }
  const savedUseTor = electronStore.get('useTor')
  if (savedUseTor !== undefined) {
    if (torStatus === true) {
      ipcRenderer.send('spawnTor')
    } else {
      ipcRenderer.send('killTor')
    }
    electronStore.set('useTor', torStatus)
    dispatch(appHandlers.actions.setUseTor(torStatus))
    return
  }
  ipcRenderer.send('spawnTor')
  dispatch(appHandlers.actions.setUseTor(torStatus))
  electronStore.set('useTor', true)
  dispatch(notificationsHandlers.actions.removeSnackbar('username'))
}

export const fetchUsers = (messages: DisplayableMessage[]) => async (dispatch, getState) => {
  const filteredZbayMessages = messages.filter(msg => msg.memohex.startsWith('ff'))
  const registrationMessages = await Promise.all(
    filteredZbayMessages.map(async transfer => {
      const message = await zbayMessages.transferToMessage(transfer)
      return message
    })
  )
  let minfee = 0
  let users = {}
  const network = nodeSelectors.network()
  const signerPubKey = identitySelector.signerPubKey(getState())
  for (const msg of registrationMessages) {
    if (
      msg.type === messageType.CHANNEL_SETTINGS &&
      staticChannels.zbay[network].publicKey === msg.publicKey
    ) {
      minfee = parseFloat(msg.message.minFee)
    }
    if (
      (msg.type !== messageType.USER && msg.type !== messageType.USER_V2) ||
      !msg.spent.gte(minfee)
    ) {
      continue
    }
    const user = ReceivedUser(msg)

    if (user !== null) {
      users = {
        ...users,
        ...user
      }
    }
  }
  dispatch(feesHandlers.actions.setUserFee(minfee))
  const isRegistrationComplete = users[signerPubKey]
  if (isRegistrationComplete) {
    if (users[signerPubKey].createdAt !== 0) {
      dispatch(
        identityActions.setRegistraionStatus({
          nickname: '',
          status: 'SUCCESS'
        })
      )
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar(
          successNotification({
            message: 'Username registered.'
          })
        )
      )
    }
  }
  dispatch(setUsers({ users }))
}
export const fetchOnionAddresses = (messages: DisplayableMessage[]) => async (
  dispatch,
  getState
) => {
  try {
    const filteredZbayMessages = messages.filter(msg => msg.memohex.startsWith('ff'))
    let users = usersSelector.users(getState())
    const registrationMessages = await Promise.all(
      filteredZbayMessages.map(async transfer => {
        const message = await zbayMessages.transferToMessage(transfer)
        return message
      })
    )
    const filteredRegistrationMessages = registrationMessages.filter(
      msg => msg.type === messageType.USER_V2
    )
    for (const msg of filteredRegistrationMessages) {
      if (users[msg.publicKey]) {
        users = {
          ...users,
          [msg.publicKey]: {
            ...users[msg.publicKey],
            onionAddress: msg.message.onionAddress
          }
        }
      }
    }
    dispatch(setUsers({ users }))
  } catch (err) {
    console.warn(err)
  }
}

let usernames = ['ala'];

// (function () {
//   try {
//     axios
//       .get(FETCH_USERNAMES_ENDPOINT)
//       .then(res => {
//         usernames = res.data.message
//       })
//       .catch(err => {
//         console.log('cant fetch usernames')
//         console.log(err)
//       })
//   } catch (err) {
//     console.log(err)
//   }
// })()

export const isNicknameTaken = username => {
  return R.includes(username, usernames)
}

export const epics = {
  fetchUsers,
  isNicknameTaken,
  createOrUpdateUser,
  registerAnonUsername,
  fetchOnionAddresses,
  registerOnionAddress
}

export const reducer = handleActions<UsersStore, PayloadType<UserActions>>(
  {
    [setUsers.toString()]: (state, { payload: { users } }: UserActions['setUsers']) => {
      return produce(state, draft => {
        const usersObj = {
          ...draft,
          ...users
        }
        return usersObj
      })
    },
    [addUnknownUser.toString()]: state =>
      produce(state, draft => {
        draft[unknownUserId] = new User({
          key: unknownUserId,
          nickname: 'Unknown',
          address: unknownUserId
        })
      }),
    [mockOwnUser.toString()]: (
      state,
      { payload: { sigPubKey, nickname, address } }: UserActions['mockOwnUser']
    ) =>
      produce(state, draft => {
        draft[sigPubKey] = new User({
          publicKey: sigPubKey,
          nickname,
          address
        })
      })
  },
  initialState
)

export default {
  reducer,
  epics,
  actions
}
