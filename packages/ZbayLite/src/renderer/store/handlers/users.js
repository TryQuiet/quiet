import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'

import appSelectors from '../selectors/app'
import feesSelector from '../selectors/fees'
import nodeSelectors from '../selectors/node'
import appHandlers from '../handlers/app'
import feesHandlers from '../handlers/fees'
import { isFinished } from '../handlers/operations'
import txnTimestampsHandlers from '../handlers/txnTimestamps'
import txnTimestampsSelector from '../selectors/txnTimestamps'
import { actionCreators } from './modals'
import notificationsHandlers from './notifications'
import channelsSelectors from '../selectors/channels'
import usersSelector from '../selectors/users'
import identitySelector from '../selectors/identity'
import { errorNotification } from './utils'
import { getPublicKeysFromSignature } from '../../zbay/messages'
import { messageType, actionTypes } from '../../../shared/static'
import { messages as zbayMessages } from '../../zbay'
import { getClient } from '../../zcash'
import { getVault } from '../../vault'
import staticChannels from '../../zcash/channels'

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
    const record0 = _ReceivedUser(publicKey0)()
    if (
      usersNicknames.get(values.message.nickname) &&
      usersNicknames.get(values.message.nickname) !== publicKey0
    ) {
      let i = 2
      while (usersNicknames.get(`${values.message.nickname} #${i}`)) {
        i++
      }
      usersNicknames.set(`${values.message.nickname} #${i}`, publicKey0)
      return record0.set(
        publicKey0,
        _UserData({
          ...values.message,
          nickname: `${values.message.nickname} #${i}`
        })
      )
    } else {
      usersNicknames.set(values.message.nickname, publicKey0)
    }

    return record0.set(publicKey0, _UserData(values.message))
  }
  return null
}

export const initialState = Immutable.Map()

export const setUsers = createAction(actionTypes.SET_USERS)

export const actions = {
  setUsers
}
const subscribeUsernameTxn = async ({ opId, callback }) => {
  const subscribe = async callback => {
    async function poll () {
      const { status, error = null } =
        (await getClient().operations.getStatus(opId)) || {}
      if (isFinished(status)) {
        return callback(error, status)
      } else {
        setTimeout(poll, 5000)
      }
    }
    return poll()
  }
  return subscribe(callback)
}
export const createOrUpdateUser = payload => async (dispatch, getState) => {
  const { nickname, firstName = '', lastName = '' } = payload
  const address = identitySelector.address(getState())
  const privKey = identitySelector.signerPrivKey(getState())
  const fee = feesSelector.userFee(getState())
  const messageData = {
    firstName,
    lastName,
    nickname,
    address
  }
  const usersChannel = channelsSelectors.usersChannel(getState())
  const registrationMessage = zbayMessages.createMessage({
    messageData: {
      type: zbayMessages.messageType.USER,
      data: messageData
    },
    privKey
  })
  const transfer = await zbayMessages.messageToTransfer({
    message: registrationMessage,
    address: usersChannel.get('address'),
    identityAddress: address,
    amount: fee.toString()
  })
  dispatch(actionCreators.closeModal('accountSettingsModal')())
  try {
    const id = await getClient().payment.send(transfer)
    await subscribeUsernameTxn({
      opId: id,
      callback: error => {
        if (error !== null) {
          dispatch(
            notificationsHandlers.actions.enqueueSnackbar(
              errorNotification({
                message:
                  'There was a problem registering your username. Please try again.',
                options: {
                  persist: true
                }
              })
            )
          )
        }
      }
    })
  } catch (err) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message:
            'There was a problem registering your username. Please try again.',
          options: {
            persist: true
          }
        })
      )
    )
  }
}

export const fetchUsers = () => async (dispatch, getState) => {
  try {
    const usersChannel = channelsSelectors.usersChannel(getState())
    const transfers = await getClient().payment.received(
      usersChannel.get('address')
    )
    let txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())

    if (
      transfers.length ===
      appSelectors.transfers(getState()).get(usersChannel.get('address'))
    ) {
      return
    } else {
      dispatch(
        appHandlers.actions.setTransfers({
          id: usersChannel.get('address'),
          value: transfers.length
        })
      )
    }
    for (const key in transfers) {
      const transfer = transfers[key]
      if (!txnTimestamps.get(transfer.txid)) {
        const result = await getClient().confirmations.getResult(transfer.txid)
        await getVault().transactionsTimestamps.addTransaction(
          transfer.txid,
          result.timereceived
        )
        await dispatch(
          txnTimestampsHandlers.actions.addTxnTimestamp({
            tnxs: { [transfer.txid]: result.timereceived.toString() }
          })
        )
      }
    }
    txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())
    const sortedTransfers = transfers.sort(
      (a, b) => txnTimestamps.get(a.txid) - txnTimestamps.get(b.txid)
    )
    const registrationMessages = await Promise.all(
      sortedTransfers.map(transfer => {
        const message = zbayMessages.transferToMessage(transfer)
        return message
      })
    )
    const sortedMessages = registrationMessages
      .filter(msg => msg !== null)
      .sort((a, b) => txnTimestamps.get(a.id) - txnTimestamps.get(b.id))

    let minfee = 0
    let users = Immutable.Map({})
    const network = nodeSelectors.network(getState())
    for (const msg of sortedMessages) {
      if (
        msg.type === messageType.CHANNEL_SETTINGS &&
        staticChannels.zbay[network].publicKey === msg.publicKey
      ) {
        minfee = parseFloat(msg.message.minFee)
      }
      if (!msg.spent.gte(minfee) || msg.type !== messageType.USER) {
        continue
      }
      const user = ReceivedUser(msg)
      if (user !== null) {
        users = users.merge(user)
      }
    }
    await dispatch(feesHandlers.actions.setUserFee(minfee))
    await dispatch(setUsers({ users }))
  } catch (err) {
    console.warn(err)
  }
}

export const isNicknameTaken = username => (dispatch, getState) => {
  const users = usersSelector.users(getState()).toJS()
  const userNames = Object.keys(users).map((key, index) => {
    return users[key].nickname
  })
  const uniqUsernames = R.uniq(userNames)
  return R.includes(username, uniqUsernames)
}

export const epics = {
  fetchUsers,
  isNicknameTaken,
  createOrUpdateUser
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
