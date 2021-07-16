import { produce, immerable } from 'immer'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'
import { remote } from 'electron'

import appSelectors from '../selectors/app'
import notificationCenterHandlers from './notificationCenter'
import { successNotification } from './utils'
import modalsHandlers from './modals'
import notificationsHandlers from './notifications'
import {
  actionTypes
} from '../../../shared/static'
import electronStore from '../../../shared/electronStore'

import { clearPublicChannels } from './publicChannels'

import { ActionsType, PayloadType } from './types'
import directMessagesHandlers from './directMessages'
import directMessagesSelectors from '../selectors/directMessages'
import debug from 'debug'

const log = Object.assign(debug('zbay:identity'), {
  error: debug('zbay:identity:err'),
  warn: debug('zbay:identity:warn')
})

interface IShippingData {

  firstName: string
  lastName: string
  street: string
  country: string
  region: string
  city: string
  postalCode: string
}
export class Identity {
  data: {
    id?: string
    address: string
    signerPrivKey: string
    signerPubKey: string
    name: string
    shippingData: IShippingData
    shieldingTax: boolean
    onionAddress: string
    addresses: string[]
  }

  loader: {
    loading: boolean
    message: string
  }

  removedChannels: string[]
  registrationStatus: {
    nickname: string
    status: string
    takenUsernames?: string[]
  }

  errors: string

  constructor(values?: Partial<Identity>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: Identity = new Identity({
  data: {
    id: null,
    address: '',
    signerPrivKey: '',
    signerPubKey: '',
    name: '',
    shippingData: {
      firstName: '',
      lastName: '',
      street: '',
      country: '',
      region: '',
      city: '',
      postalCode: ''
    },
    shieldingTax: true,
    onionAddress: '',
    addresses: []
  },
  loader: {
    loading: false,
    message: ''
  },
  removedChannels: [],
  registrationStatus: {
    nickname: '',
    status: 'UNREGISTERED',
    takenUsernames: []
  },
  errors: ''
})

export const setLoading = createAction<boolean>(actionTypes.SET_IDENTITY_LOADING)
export const setRemovedChannels = createAction<any[]>(actionTypes.SET_REMOVED_CHANNELS)
export const setLoadingMessage = createAction<string>(actionTypes.SET_IDENTITY_LOADING_MESSAGE)
export const setIdentity = createAction(actionTypes.SET_IDENTITY) // TODO: find identity type
export const setBalance = createAction<BigNumber>(actionTypes.SET_IDENTITY_BALANCE)
export const setOnionAddress = createAction<string>(actionTypes.SET_ONION_ADDRESS)
export const setLockedBalance = createAction<BigNumber>(actionTypes.SET_IDENTITY_LOCKED_BALANCE)
export const setFetchingBalance = createAction<boolean>(actionTypes.SET_FETCHING_BALANCE)
export const setErrors = createAction<string>(actionTypes.SET_IDENTITY_ERROR)
export const setShippingData = createAction<IShippingData>(actionTypes.SET_IDENTITY_SHIPPING_DATA)
export const setDonationAllow = createAction<boolean>(actionTypes.SET_DONATION_ALLOW)
export const setDonationAddress = createAction<string>(actionTypes.SET_DONATION_ADDRESS)
export const setShieldingTax = createAction<boolean>(actionTypes.SET_SHIELDING_TAX)
export const setFreeUtxos = createAction<number>(actionTypes.SET_FREE_UTXOS)
export const setUserAddreses = createAction<string[]>(actionTypes.SET_USER_ADDRESSES)
export const setRegistraionStatus = createAction<{
  nickname: string
  status: string
  takenUsernames?: string[]
}>(actionTypes.SET_REGISTRATION_STATUS)
export const setUserShieldedAddreses = createAction<any[]>(actionTypes.SET_USER_SHIELDED_ADDRESES)

export const actions = {
  setIdentity,
  setRemovedChannels,
  setFetchingBalance,
  setErrors,
  setLoading,
  setLoadingMessage,
  setLockedBalance,
  setShippingData,
  setBalance,
  setDonationAllow,
  setDonationAddress,
  setShieldingTax,
  setFreeUtxos,
  setOnionAddress,
  setRegistraionStatus,
  setUserAddreses,
  setUserShieldedAddreses
}

export type IdentityActions = ActionsType<typeof actions>

export const createIdentity = ({ name }) => async () => {
  let zAddress
  let tAddress
  let tpk
  let sk
  let signerPrivKey
  let signerPubKey
  try {
    electronStore.set('identity', {
      name,
      address: zAddress,
      transparentAddress: tAddress,
      signerPubKey,
      signerPrivKey,
      keys: {
        tpk,
        sk
      },
      certificate: '',
      certPrivKey: ''
    })

    return electronStore.get('identity')
  } catch (err) {
    log.error('error', err)
  }
}

export const loadIdentity = () => async dispatch => {
  const identity = electronStore.get('identity')
  if (identity) {
    await dispatch(setIdentity(identity))
  }
}

export const prepareUpgradedVersion = () => async (dispatch, getState) => {
  // Temporary fix for apps upgraded from versions < 3
  if (!electronStore.get('isNewUser') && !electronStore.get('appUpgraded')) {
    const appVersion = appSelectors.version(getState())
    const appVersionNumber = Number(appVersion.split('-')[0].split('.')[0])
    if (appVersionNumber >= 3) {
      dispatch(clearPublicChannels())
      electronStore.set('appUpgraded', true)
    }
  }
}

export const setIdentityEpic = identityToSet => async (dispatch, getState) => {
  const hasWaggleIdentity = directMessagesSelectors.publicKey(getState())
  const identity = identityToSet
  dispatch(setLoading(true))
  const isNewUser = electronStore.get('isNewUser')
  try {
    const removedChannels = electronStore.get('removedChannels')
    if (removedChannels) {
      const removedChannelsList = Object.keys(removedChannels)
      dispatch(setRemovedChannels(removedChannelsList))
    }
    remote.app.setBadgeCount(0)
    dispatch(setLoadingMessage('Ensuring identity integrity'))
    await dispatch(setLoadingMessage('Ensuring node contains identity keys'))
    await dispatch(notificationCenterHandlers.epics.init())
    dispatch(setLoadingMessage('Setting identity'))
    await dispatch(setIdentity(identity))
    const shippingAddress = electronStore.get('identity.shippingData')
    if (shippingAddress) {
      dispatch(setShippingData(shippingAddress))
    }
    dispatch(setLoadingMessage('Fetching balance and loading channels'))
    if (!hasWaggleIdentity) {
      await dispatch(directMessagesHandlers.epics.generateDiffieHellman())
    }
    await dispatch(prepareUpgradedVersion())
    dispatch(setLoadingMessage('Loading users and messages'))
  } catch (err) { }
  if (isNewUser === true) {
    dispatch(modalsHandlers.actionCreators.openModal('createUsernameModal')())
  }

  dispatch(setLoadingMessage(''))
  dispatch(setLoading(false))

  if (electronStore.get('isNewUser')) {
    // const users = usersSelectors.users(getState())
    // const usersValues = Object.values(users)
    // const holmesContactArray = usersValues.filter(item => {
    //   return item.publicKey === '02dc8264c555d46b3f6b16f1e751e979ebc69e6df6a02e7d4074a5df981e507da2'
    // })
    // const holmesContact = holmesContactArray[0]

    // await dispatch(contactsHandlers.epics.createVaultContact({ contact: holmesContact, history }))

    // const messageFromHolmes = {
    //   type: 1,
    //   spent: '0',
    //   fromYou: false,
    //   status: 'broadcasted',
    //   blockHeight: 0,
    //   signature: {
    //     type: 'Buffer',
    //     data: [88]
    //   },
    //   r: 1,
    //   message: 'holmes message',
    //   typeIndicator: false,
    //   createdAt: DateTime.utc().toSeconds(),
    //   id: '',
    //   sender: {
    //     replyTo: 'zs1ydvkmgvraapkzwuvrva2d8c8eslmkw3wtlx0kuq0vu23xvnc753d35qjdlklmu9rr40a6kla2wx',
    //     username: 'holmes'
    //   }
    // }

    // const messageHi = ({
    //   ...messageFromHolmes,
    //   blockHeight: 9999999999999999,
    //   createdAt: Math.floor(DateTime.utc().toSeconds() + 1),
    //   id: 'sklf7894hthur7467sd786fsjh49832095usldf89345jklhj34s98734lkjfdsa',
    //   message:
    //     'Hi! My name’s Holmes. Previously I co-founded the activist organization https://fightforthefuture.org, which fights for privacy and freedom online.'
    // } as unknown) as DisplayableMessage

    // const messageOurGoal = ({
    //   ...messageFromHolmes,
    //   blockHeight: 9999999999999999,
    //   createdAt: Math.floor(DateTime.utc().toSeconds() + 2),
    //   id: 'opcvlkdsjjpe04908589234lnfs0d9f82038lnmpqweri02978234ljhlsdfu821',
    //   message:
    //     'Now I’m working on Zbay, to build a team chat space like Slack or Discord, but with no central server to leak your team’s entire chat history, and with private digital money (Zcash) built-in.'
    // } as unknown) as DisplayableMessage

    // const messageZbay = ({
    //   ...messageFromHolmes,
    //   blockHeight: 9999999999999999,
    //   createdAt: Math.floor(DateTime.utc().toSeconds() + 3),
    //   id: 'aoiurhtnlksjdfjs0d99849233lojkkljhsioduyfo09r8t39045uilknfsldfj9',
    //   message:
    //     'Any questions? Feedback? Annoyances? Burning needs where if Zbay met them you’d use it every day? If so, message me here!'
    // } as unknown) as DisplayableMessage

    // await dispatch(
    //   contactsHandlers.actions.setMessages({
    //     key: holmesContact.publicKey,
    //     username: holmesContact.nickname,
    //     contactAddress: holmesContact.address,
    //     messages: [messageHi, messageOurGoal, messageZbay]
    //   })
    // )
  }
  if (electronStore.get('isMigrating')) {
    dispatch(modalsHandlers.actionCreators.openModal('migrationModal')())
  }
}

export const updateShippingData = (values, formActions) => async dispatch => {
  electronStore.set('identity.shippingData', values)
  await dispatch(setShippingData(values))
  dispatch(
    notificationsHandlers.actions.enqueueSnackbar(
      successNotification({ message: 'Shipping Address Updated' })
    )
  )
  formActions.setSubmitting(false)
}

export const updateDonation = () => async dispatch => {
  dispatch(
    notificationsHandlers.actions.enqueueSnackbar(
      successNotification({ message: 'Donation information updated' })
    )
  )
}

const epics = {
  createIdentity,
  setIdentity: setIdentityEpic,
  updateShippingData,
  updateDonation,
  loadIdentity
}

export const reducer = handleActions<Identity, PayloadType<IdentityActions>>(
  {
    [setLoading.toString()]: (state, { payload: loading }: IdentityActions['setLoading']) =>
      produce(state, draft => {
        draft.loader.loading = loading
      }),
    [setLoadingMessage.toString()]: (
      state,
      { payload: message }: IdentityActions['setLoadingMessage']
    ) =>
      produce(state, draft => {
        draft.loader.message = message
      }),
    [setIdentity.toString()]: (state, { payload: identity }: IdentityActions['setIdentity']) =>
      produce(state, draft => {
        draft.data = Object.assign({}, draft.data, identity)
      }),
    [setErrors.toString()]: (state, { payload: errors }: IdentityActions['setErrors']) =>
      produce(state, draft => {
        draft.errors = errors
      }),
    [setShippingData.toString()]: (
      state,
      { payload: shippingData }: IdentityActions['setShippingData']
    ) =>
      produce(state, draft => {
        draft.data.shippingData = shippingData
      }),
    [setUserAddreses.toString()]: (
      state,
      { payload: addresses }: IdentityActions['setUserAddreses']
    ) =>
      produce(state, draft => {
        draft.data.addresses = addresses
      }),
    [setRegistraionStatus.toString()]: (
      state,
      { payload }: IdentityActions['setRegistraionStatus']
    ) =>
      produce(state, draft => {
        draft.registrationStatus = payload
      })
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
