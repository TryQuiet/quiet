import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'
import { ipcRenderer } from 'electron'

import feesSelector from '../selectors/fees'
import nodeSelectors from '../selectors/node'
import feesHandlers from './fees'
import appHandlers from './app'
import { fetchAllMessages } from '../handlers/messages'
import { actionCreators } from './modals'
import usersSelector from '../selectors/users'
import identitySelector from '../selectors/identity'
import { actions as identityActions } from '../handlers/identity'
import appSelectors from '../selectors/app'
import { getPublicKeysFromSignature } from '../../zbay/messages'
import { messageType, actionTypes, unknownUserId } from '../../../shared/static'
import { messages as zbayMessages } from '../../zbay'
import client from '../../zcash'
import staticChannels from '../../zcash/channels'
import notificationsHandlers from './notifications'
import { infoNotification, successNotification } from './utils'
import electronStore from '../../../shared/electronStore'

import { DisplayableMessage } from '../../zbay/messages.types'

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

export const checkRegistrationConfirmations = ({ firstRun }) => (dispatch, getState) => {
  if (firstRun) {
    const publicKey = identitySelector.signerPubKey(getState())
    const address = identitySelector.address(getState())
    const nickname = electronStore.get('registrationStatus.nickname')
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
  }
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    const txid = electronStore.get('registrationStatus.txid')
    const txns = await fetchAllMessages()
    const outgoingTransactions = txns.undefined
    const registrationTransaction = outgoingTransactions.filter(el => el.txid === txid)[0]
    if (registrationTransaction) {
      const { block_height: blockHeight } = registrationTransaction
      const currentHeight = await client.height()
      if (currentHeight - blockHeight > 9) {
        electronStore.set('registrationStatus.status', 'SUCCESS')
        electronStore.set('registrationStatus.confirmation', 10)
        dispatch(
          notificationsHandlers.actions.enqueueSnackbar(
            successNotification({
              message: 'Username registered.'
            })
          )
        )
      } else {
        electronStore.set('registrationStatus.confirmation', currentHeight - blockHeight)
        dispatch(checkRegistrationConfirmations({ firstRun: false }))
      }
    }
  }, 75000)
}

export const createOrUpdateUser = (payload: {
  nickname: string
  firstName?: string
  lastName?: string
  debounce?: boolean
  retry?: number
}) => async (dispatch, getState) => {
  const { nickname, firstName = '', lastName = '', debounce = false, retry = 0 } = payload
  const publicKey = identitySelector.signerPubKey(getState())
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
  const onionAddress = identitySelector.onionAddress(getState())
  const messageDataTor = {
    onionAddress: onionAddress.substring(0, 56)
  }
  const torChannelAddress = staticChannels.tor.mainnet.address
  const registrationMessageTor = zbayMessages.createMessage({
    messageData: {
      type: zbayMessages.messageType.USER_V2,
      data: messageDataTor
    },
    privKey
  })
  const transferTor = await zbayMessages.messageToTransfer({
    message: registrationMessageTor,
    address: torChannelAddress
  })
  try {
    const txid = await client.sendTransaction([transferTor, transfer])
    if (retry === 0) {
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
      electronStore.set('registrationStatus', {
        nickname,
        status: 'IN_PROGRESS'
      })
    }
    if (txid.error) {
      throw new Error(txid.error)
    }
    ipcRenderer.send('spawnTor')
    electronStore.set('useTor', true)
    dispatch(appHandlers.actions.setUseTor(true))
    electronStore.set('registrationStatus.txid', txid.txid)
    electronStore.set('registrationStatus.confirmation', 0)
    dispatch(checkRegistrationConfirmations({ firstRun: true }))
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({
          message: 'Registering username—this can take a few minutes.'
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
            message: 'Waiting for funds to register username—this can take a few minutes.',
            key: 'username'
          })
        )
      )
    }
    if (debounce && retry < 10) {
      setTimeout(() => {
        dispatch(createOrUpdateUser({ ...payload, retry: retry + 1 }))
      }, 75000)
      return
    }
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
  console.log('sending transaction with onion address')
  if (txid.error) {
    console.log('error while sending transaction with onion address')
    throw new Error(txid.error)
  }
  dispatch(
    notificationsHandlers.actions.enqueueSnackbar(
      successNotification({
        message: 'Your onion address will be public in few minutes'
      })
    )
  )
  dispatch(notificationsHandlers.actions.removeSnackbar('username'))
}

export const fetchUsers = (messages: DisplayableMessage[]) => async (dispatch, getState) => {
  const filteredZbayMessages = messages.filter(msg => msg.memohex.startsWith('ff'))
  const registrationMessages = await Promise.all(
    filteredZbayMessages.map(async transfer => {
      const message = zbayMessages.transferToMessage(transfer)
      return await message
    })
  )
  let minfee = 0
  let users = {}
  const network = nodeSelectors.network()
  const { status: registrationStatus } = identitySelector.registrationStatus(getState())
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
  if (!isRegistrationComplete && registrationStatus === 'IN_PROGRESS') {
    const publicKey = identitySelector.signerPubKey(getState())
    const address = identitySelector.address(getState())
    const { nickname } = identitySelector.registrationStatus(getState())
    const mockedUser = {
      [publicKey]: {
        ..._UserData,
        address,
        nickname,
        publicKey
      }
    }
    users = {
      ...users,
      ...mockedUser
    }
  } else {
    dispatch(
      identityActions.setRegistraionStatus({
        nickname: '',
        status: 'SUCCESS'
      })
    )
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
        const message = zbayMessages.transferToMessage(transfer)
        return await message
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

export const isNicknameTaken = username => (_dispatch, getState) => {
  const users = usersSelector.users(getState())
  const userNames = Object.keys(users)
    .map(key => {
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
  registerOnionAddress,
  checkRegistrationConfirmations
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
