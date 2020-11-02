import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'
import { ipcRenderer } from 'electron'

import feesSelector from '../selectors/fees'
import nodeSelectors from '../selectors/node'
import feesHandlers from '../handlers/fees'
import appHandlers from '../handlers/app'
import { checkTransferCount } from '../handlers/messages'
import { actionCreators } from './modals'
import usersSelector from '../selectors/users'
import identitySelector from '../selectors/identity'
import appSelectors from '../selectors/app'
import { getPublicKeysFromSignature } from '../../zbay/messages'
import { messageType, actionTypes, unknownUserId } from '../../../shared/static'
import { messages as zbayMessages } from '../../zbay'
import client from '../../zcash'
import staticChannels from '../../zcash/channels'
import notificationsHandlers from './notifications'
import { infoNotification, successNotification } from './utils'
import electronStore from '../../../shared/electronStore'

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
    ..._UserData
  }
})

const usersNicknames = new Map()

export const ReceivedUser = values => {
  if (values === null || ![0, 1].includes(values.r)) {
    return null
  }
  if (values.type === messageType.USER) {
    const publicKey0 = getPublicKeysFromSignature(values).toString('hex')
    for (let i of usersNicknames.keys()) {
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
          ..._UserData,
          ...values.message,
          nickname: `${values.message.nickname} #${i}`,
          createdAt: values.createdAt,
          publicKey: values.publicKey
        }
      }
      return record0
    } else {
      usersNicknames.set(values.message.nickname, publicKey0)
    }
    record0 = {
      ...record0,
      [publicKey0]: {
        ..._UserData,
        ...values.message,
        createdAt: values.createdAt,
        publicKey: values.publicKey
      }
    }
    return record0
  }
  return null
}

export const initialState = {}

export const setUsers = createAction(actionTypes.SET_USERS)
export const addUnknownUser = createAction(actionTypes.ADD_UNKNOWN_USER)

export const actions = {
  setUsers,
  addUnknownUser
}

export const registerAnonUsername = () => async (dispatch, getState) => {
  const publicKey = identitySelector.signerPubKey(getState())
  await dispatch(
    createOrUpdateUser({ nickname: `anon${publicKey.substring(0, 10)}` })
  )
}
export const createOrUpdateUser = payload => async (dispatch, getState) => {
  const {
    nickname,
    firstName = '',
    lastName = '',
    debounce = false,
    retry = 0
  } = payload
  const address = identitySelector.address(getState())
  const privKey = identitySelector.signerPrivKey(getState())
  const fee = feesSelector.userFee(getState())
  const messageData = {
    firstName,
    lastName,
    nickname,
    address
  }
  const usersChannelAddress = staticChannels.registeredUsers.mainnet.address
  const registrationMessage = zbayMessages.createMessage({
    messageData: {
      type: zbayMessages.messageType.USER,
      data: messageData
    },
    privKey
  })
  const transfer = await zbayMessages.messageToTransfer({
    message: registrationMessage,
    address: usersChannelAddress,
    amount: fee
  })
  dispatch(actionCreators.closeModal('accountSettingsModal')())
  try {
    const txid = await client.sendTransaction(transfer)
    if (txid.error) {
      throw new Error(txid.error)
    }
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({
          message: `Your username will be confirmed in few minutes`
        })
      )
    )
    dispatch(notificationsHandlers.actions.removeSnackbar('username'))
  } catch (err) {
    console.log(err)
    if (retry === 0) {
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar(
          infoNotification({
            message: `Waiting for funds from faucet`,
            key: 'username'
          })
        )
      )
    }
    if (debounce === true && retry < 10) {
      setTimeout(() => {
        dispatch(createOrUpdateUser({ ...payload, retry: retry + 1 }))
      }, 75000)
      return
    }
    dispatch(actionCreators.openModal('failedUsernameRegister')())
  }
}
export const registerOnionAddress = torStatus => async (dispatch, getState) => {
  const useTor = appSelectors.useTor(getState())
  if (useTor === torStatus) {
    return
  }
  const savedUseTor = electronStore.get(`useTor`)
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
  const privKey = identitySelector.signerPrivKey(getState())
  const onionAddress = identitySelector.onionAddress(getState())
  const messageData = {
    onionAddress: onionAddress.substring(0, 56)
  }
  const torChannelAddress = staticChannels.tor.mainnet.address
  const registrationMessage = zbayMessages.createMessage({
    messageData: {
      type: zbayMessages.messageType.USER_V2,
      data: messageData
    },
    privKey
  })
  const transfer = await zbayMessages.messageToTransfer({
    message: registrationMessage,
    address: torChannelAddress
  })
  // dispatch(actionCreators.closeModal('accountSettingsModal')())
  const txid = await client.sendTransaction(transfer)
  if (txid.error) {
    throw new Error(txid.error)
  }
  dispatch(
    notificationsHandlers.actions.enqueueSnackbar(
      successNotification({
        message: `Your onion address will be public in few minutes`
      })
    )
  )
  dispatch(notificationsHandlers.actions.removeSnackbar('username'))
}

export const fetchUsers = (address, messages) => async (dispatch, getState) => {
  try {
    const transferCountFlag = await dispatch(
      checkTransferCount(address, messages)
    )
    if (transferCountFlag === -1 || !messages) {
      return
    }
    const filteredZbayMessages = messages.filter(msg =>
      msg.memohex.startsWith('ff')
    )
    const registrationMessages = await Promise.all(
      filteredZbayMessages.map(transfer => {
        const message = zbayMessages.transferToMessage(transfer)
        return message
      })
    )
    let minfee = 0
    let users = {}
    const network = nodeSelectors.network(getState())
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
    dispatch(setUsers({ users }))
  } catch (err) {
    throw err
  }
}
export const fetchOnionAddresses = (address, messages) => async (
  dispatch,
  getState
) => {
  try {
    const transferCountFlag = await dispatch(
      checkTransferCount(address, messages)
    )
    if (transferCountFlag === -1 || !messages) {
      return
    }
    const filteredZbayMessages = messages.filter(msg =>
      msg.memohex.startsWith('ff')
    )
    let users = usersSelector.users(getState())
    const registrationMessages = await Promise.all(
      filteredZbayMessages.map(transfer => {
        const message = zbayMessages.transferToMessage(transfer)
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

export const isNicknameTaken = username => (dispatch, getState) => {
  const users = usersSelector.users(getState())
  const userNames = Object.keys(users)
    .map((key, index) => {
      return users[key].nickname
    })
    .filter(name => !name.startsWith('anon'))
  const uniqUsernames = R.uniq(userNames)
  return R.includes(username, uniqUsernames)
}

export const epics = {
  fetchUsers,
  isNicknameTaken,
  createOrUpdateUser,
  registerAnonUsername,
  fetchOnionAddresses,
  registerOnionAddress
}

export const reducer = handleActions(
  {
    [setUsers]: (state, { payload: { users } }) => {
      return produce(state, (draft) => {
        const usersObj = {
          ...draft,
          ...users
        }
        return usersObj
      })
    },
    [addUnknownUser]: (state) => produce(state, (draft) => {
      draft[unknownUserId] = {
        key: unknownUserId,
        nickname: 'unknown',
        address: unknownUserId
      }
    })
  },
  initialState
)

export default {
  reducer,
  epics,
  actions
}
