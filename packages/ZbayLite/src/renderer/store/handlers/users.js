import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'

import feesSelector from '../selectors/fees'
import nodeSelectors from '../selectors/node'
import feesHandlers from '../handlers/fees'
import { checkTransferCount } from '../handlers/messages'
import { actionCreators } from './modals'
import usersSelector from '../selectors/users'
import identitySelector from '../selectors/identity'
import { getPublicKeysFromSignature } from '../../zbay/messages'
import { messageType, actionTypes } from '../../../shared/static'
import { messages as zbayMessages } from '../../zbay'
import client from '../../zcash'
import staticChannels from '../../zcash/channels'

const _ReceivedUser = publicKey =>
  Immutable.Record(
    {
      [publicKey]: _UserData()
    },
    'ReceivedUser'
  )
export const _UserData = Immutable.Record(
  {
    firstName: '',
    publicKey: '',
    lastName: '',
    nickname: '',
    address: '',
    createdAt: 0
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
          nickname: `${values.message.nickname} #${i}`,
          createdAt: values.createdAt,
          publicKey: values.publicKey
        })
      )
    } else {
      usersNicknames.set(values.message.nickname, publicKey0)
    }

    return record0.set(
      publicKey0,
      _UserData({
        ...values.message,
        createdAt: values.createdAt,
        publicKey: values.publicKey
      })
    )
  }
  return null
}

export const initialState = Immutable.Map({
  '025669600202e2d4f678d800b1cfc7fa5bf7d8a0fa0136e1b7722cbcaa591f042b': _UserData(
    {
      nickname: 'norbi',
      address:
        'zs1xyk77jcla0r0nv82ck2ukmp45t6gvhkf9etwdmhdp3hdc9tc39fqaunahwr72csgvenjgv5rp65',
      publicKey:
        '025669600202e2d4f678d800b1cfc7fa5bf7d8a0fa0136e1b7722cbcaa591f042b'
    }
  ),
  c7e7c14740c3372fffe47c845a2b6720: _UserData({
    nickname: 'Unknown',
    address: 'c7e7c14740c3372fffe47c845a2b6720',
    publicKey: 'c7e7c14740c3372fffe47c845a2b6720'
  }),
  '02ff9facdc8326c41e6cb191384b4f8d98196739287f2edbf0036e5f6aeec1eba7': _UserData(
    {
      nickname: 'janusz2',
      address:
        'zs1ladffadkyr47aeqtw0t29e4hx7gz9064k9enlvfqsdmn23f9u8mku44geeu2f8n0spkfw5l2qg7',
      publicKey:
        '02ff9facdc8326c41e6cb191384b4f8d98196739287f2edbf0036e5f6aeec1eba7'
    }
  ),
  '032b05d47db0cbfdac283e349830c9d82345652234572359bdd011f1ead602ce28': _UserData(
    {
      nickname: 'janusz',
      address:
        'zs1uv0l8x6l72hjcpm7pvvff22a22d6rqrsg20w06nqhmmmt0ufrfyl6t0vlgtgmxtl7vgkyp32se2',
      publicKey:
        '032b05d47db0cbfdac283e349830c9d82345652234572359bdd011f1ead602ce28'
    }
  ),
  '03722c40d86a80d4e4acb3d7798e3661684d484ec38fedb97f3827734a0d6875fc': _UserData(
    {
      nickname: 'norbert',
      address:
        'zs1ynfef5z7sxw4nvuf082upu8s6eqv5rregwz00qfjqdgaaugfk5ufmrq843luz04vn22jke4vk5c',
      publicKey:
        '03722c40d86a80d4e4acb3d7798e3661684d484ec38fedb97f3827734a0d6875fc'
    }
  ),
  '029083a5d2ed499b32be4e25f161463b925142a7aae653d8b8337daec9cb5b9ec3': _UserData(
    {
      nickname: 'holmes',
      address:
        'zs13rvylvg9y7zgvq35gnxdtwgja2skwjnwdljvk3h5qme93js3r4sunqwpx0xvk2cpmxdkkxz8sd3',
      publicKey:
        '029083a5d2ed499b32be4e25f161463b925142a7aae653d8b8337daec9cb5b9ec3'
    }
  )
})

export const setUsers = createAction(actionTypes.SET_USERS)

export const actions = {
  setUsers
}

export const registerAnonUsername = () => async (dispatch, getState) => {
  const publicKey = identitySelector.signerPubKey(getState())
  await dispatch(
    createOrUpdateUser({ nickname: `anon${publicKey.substring(0, 10)}` })
  )
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
    await client.sendTransaction(transfer)
    // await subscribeUsernameTxn({
    //   opId: id,
    //   callback: error => {
    //     if (error !== null) {
    //       dispatch(actionCreators.openModal('failedUsernameRegister')())
    //     }
    //   }
    // })
  } catch (err) {
    console.log(err)
    dispatch(actionCreators.openModal('failedUsernameRegister')())
  }
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
    console.log(registrationMessages)
    let minfee = 0
    let users = Immutable.Map({})
    const network = nodeSelectors.network(getState())
    for (const msg of registrationMessages) {
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
  registerAnonUsername
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
