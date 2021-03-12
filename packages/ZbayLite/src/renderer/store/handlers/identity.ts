import { produce, immerable } from 'immer'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'
import secp256k1 from 'secp256k1'
import { randomBytes } from 'crypto'
import { DateTime } from 'luxon'
import { ipcRenderer, remote } from 'electron'

import client from '../../zcash'
import channels from '../../zcash/channels'

import identitySelectors from '../selectors/identity'
import appSelectors from '../selectors/app'
import txnTimestampsSelector from '../selectors/txnTimestamps'
import coordinatorHandlers from './coordinator'
import whitelistHandlers from './whitelist'
import ownedChannelsHandlers from './ownedChannels'
import txnTimestampsHandlers from './txnTimestamps'
import ratesHandlers from './rates'
import nodeHandlers from './node'
import usersHandlers from './users'
import notificationCenterHandlers from './notificationCenter'
import { successNotification } from './utils'
import modalsHandlers from './modals'
import notificationsHandlers from './notifications'
import messagesHandlers from './messages'
import contactsHandlers from './contacts'
import {
  actionTypes,
  networkFeeSatoshi,
  satoshiMultiplier,
  networkFee
} from '../../../shared/static'
import electronStore, { migrationStore } from '../../../shared/electronStore'
import staticChannelsSyncHeight from '../../static/staticChannelsSyncHeight.json'

import { PublicChannel } from './publicChannels'

import { ActionsType, PayloadType } from './types'
import { DisplayableMessage } from '../../zbay/messages.types'

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
    transparentAddress: string
    signerPrivKey: string
    signerPubKey: string
    name: string
    shippingData: IShippingData
    balance?: BigNumber
    lockedBalance?: BigNumber
    donationAllow: boolean
    shieldingTax: boolean
    donationAddress: string
    onionAddress: string
    freeUtxos: number
    addresses: string[]
    shieldedAddresses: string[]
  }

  fetchingBalance: boolean
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
    transparentAddress: '',
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
    balance: null,
    lockedBalance: null,
    donationAllow: true,
    shieldingTax: true,
    donationAddress: '',
    onionAddress: '',
    freeUtxos: 0,
    addresses: [],
    shieldedAddresses: []
  },
  fetchingBalance: false,
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
export const setRegistraionStatus = createAction<{ nickname: string; status: string; takenUsernames?: string[] }>(
  actionTypes.SET_REGISTRAION_STATUS
)
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

export const fetchAffiliateMoney = () => async (dispatch, getState) => {
  try {
    const identityAddress = identitySelectors.address(getState())
    const transfers = (await client().payment.received(identityAddress)) as DisplayableMessage[]
    const affiliatesTransfers = transfers.filter(msg => msg.memo.startsWith('aa'))
    let amount = 0
    const txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())
    for (const transfer of affiliatesTransfers) {
      if (!txnTimestamps[transfer.txid]) {
        amount += transfer.amount
        const result = await client().confirmations.getResult(transfer.txid)
        await dispatch(
          txnTimestampsHandlers.actions.addTxnTimestamp({
            tnxs: { [transfer.txid]: result.timereceived.toString() }
          })
        )
      }
    }
    if (amount) {
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar(
          successNotification({
            message: `You received ${amount} ZEC from your affiliates`
          })
        )
      )
    }
  } catch (err) {}
}
export const fetchBalance = () => async (dispatch, getState) => {
  try {
    dispatch(setFetchingBalance(true))
    const address = identitySelectors.address(getState())

    const balanceObj = await client.balance()
    const notes = await client.notes()
    const balance = balanceObj.tbalance / satoshiMultiplier
    if (balance > networkFee) {
      await dispatch(
        shieldBalance({
          to: address,
          amount: balance - networkFee
        })
      )
    }
    const pending = notes.pending_notes.reduce((acc: number, cur) => acc + (cur.value as number), 0)
    dispatch(
      setLockedBalance(
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        new BigNumber((balanceObj.unverified_zbalance + pending) / satoshiMultiplier)
      )
    )
    dispatch(setBalance(new BigNumber(balanceObj.spendable_zbalance / satoshiMultiplier)))
  } catch (err) {
    dispatch(setErrors(err.message))
  } finally {
    dispatch(setFetchingBalance(false))
  }
}
export const fetchFreeUtxos = () => async dispatch => {
  try {
    const utxos = await client.notes()
    const freeUtxos = utxos.unspent_notes.filter(
      utxo => utxo.value > networkFeeSatoshi && utxo.spendable === true
    )
    dispatch(setFreeUtxos(freeUtxos.length))
  } catch (err) {
    console.warn(err)
  }
}

export const createSignerKeys = () => {
  let signerPrivKey
  do {
    signerPrivKey = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(signerPrivKey))
  return {
    signerPrivKey: signerPrivKey.toString('hex'),
    signerPubKey: secp256k1.publicKeyCreate(signerPrivKey, true).toString('hex')
  }
}
let shielding = false
export const shieldBalance = ({ to, amount }) => async dispatch => {
  if (shielding) {
    return
  }
  shielding = true
  await client.shield(to)
  dispatch(
    notificationsHandlers.actions.enqueueSnackbar(
      successNotification({
        message: `You will soon receive ${amount.toString()} from your transparent address`
      })
    )
  )
  setTimeout(() => {
    shielding = false
  }, 300000)
}

export const createIdentity = ({ name, fromMigrationFile }) => async () => {
  let zAddress
  let tAddress
  let tpk
  let sk
  let signerPrivKey
  let signerPubKey
  try {
    const accountAddresses = await client.addresses()
    const { t_addresses: tAddresses } = accountAddresses

    if (fromMigrationFile) {
      electronStore.set('isMigrating', true)
      const migrationIdentity = migrationStore.get('identity')
      zAddress = migrationIdentity.address
      tAddress = tAddresses[0]
      tpk = await client.getPrivKey(tAddress)
      sk = migrationIdentity.keys.sk
      await client.importKey(sk)
      signerPrivKey = migrationIdentity.signerPrivKey
      signerPubKey = migrationIdentity.signerPubKey
    } else {
      const { z_addresses: zAddresses } = accountAddresses
      zAddress = zAddresses[0]
      tAddress = tAddresses[0]
      tpk = await client.getPrivKey(tAddress)
      sk = await client.getPrivKey(zAddress)

      const keys = exportFunctions.createSignerKeys()
      signerPrivKey = keys.signerPrivKey
      signerPubKey = keys.signerPubKey
    }

    electronStore.set('identity', {
      name,
      address: zAddress,
      transparentAddress: tAddress,
      signerPubKey,
      signerPrivKey,
      keys: {
        tpk,
        sk
      }
    })
    const network = 'mainnet'

    if (fromMigrationFile) {
      const migrationChannels: PublicChannel[] = Object.values(migrationStore.get('channels'))
      for (const channel of migrationChannels) {
        electronStore.set(`importedChannels.${channel.address}`, {
          address: channel.address,
          name: channel.name,
          description: '',
          owner: channel.keys.sk ? signerPubKey : '',
          keys: channel.keys
        })
        await client.importKey(channel.keys.sk ? channel.keys.sk : channel.keys.ivk)
      }
      migrationStore.clear()
    }
    const channelsToImport = [
      'general',
      'registeredUsers',
      'channelOfChannels',
      'store',
      'priceOracle',
      'tor'
    ]
    const channelsWithDetails = channelsToImport.reduce((o, key) => {
      const channelDetails = channels[key][network]
      const preparedChannel = {
        name: channelDetails.name,
        private: channelDetails.private,
        address: channelDetails.address,
        unread: channelDetails.unread,
        description: channelDetails.description,
        keys: channelDetails.keys,
        lastSeen: DateTime.utc().toSeconds()
      }
      return { ...o, [preparedChannel.address]: preparedChannel }
    }, {})
    electronStore.set('defaultChannels', channelsWithDetails)
    const channelsToLoad = Object.keys(channelsWithDetails)
    for (const channel of channelsToLoad) {
      await client.importKey(channelsWithDetails[channel].keys.ivk, staticChannelsSyncHeight.height)
    }

    setTimeout(() => {
      client.rescan()
    }, 0)
    return electronStore.get('identity')
  } catch (err) {
    console.log('error', err)
  }
}

export const loadIdentity = () => async dispatch => {
  const identity = electronStore.get('identity')
  if (identity) {
    await dispatch(setIdentity(identity))
  }
}

export const setIdentityEpic = identityToSet => async (dispatch, getState) => {
  const identity = identityToSet
  dispatch(setLoading(true))
  const isNewUser = electronStore.get('isNewUser')
  const useTor = appSelectors.useTor(getState())
  electronStore.set('useTor', useTor)
  try {
    const removedChannels = electronStore.get('removedChannels')
    if (removedChannels) {
      const removedChannelsList = Object.keys(removedChannels)
      dispatch(setRemovedChannels(removedChannelsList))
    }
    remote.app.setBadgeCount(0)
    dispatch(setLoadingMessage('Ensuring identity integrity'))
    await dispatch(setLoadingMessage('Ensuring node contains identity keys'))
    await dispatch(whitelistHandlers.epics.initWhitelist())
    await dispatch(notificationCenterHandlers.epics.init())
    dispatch(setLoadingMessage('Setting identity'))
    await dispatch(setIdentity(identity))
    const shippingAddress = electronStore.get('identity.shippingData')
    if (shippingAddress) {
      dispatch(setShippingData(shippingAddress))
    }
    dispatch(setLoadingMessage('Fetching balance and loading channels'))
    await dispatch(initAddreses())
    dispatch(ownedChannelsHandlers.epics.getOwnedChannels())
    dispatch(ratesHandlers.epics.setInitialPrice())
    await dispatch(nodeHandlers.epics.getStatus())
    await dispatch(fetchBalance())
    await dispatch(fetchFreeUtxos())
    await dispatch(messagesHandlers.epics.fetchMessages())
    if (!useTor) {
      ipcRenderer.send('killTor')
    }
    setTimeout(() => dispatch(coordinatorHandlers.epics.coordinator()), 5000)
    dispatch(setLoadingMessage('Loading users and messages'))
  } catch (err) {}
  if (isNewUser === true) {
    await dispatch(usersHandlers.epics.fetchTakenUsernames())
    dispatch(modalsHandlers.actionCreators.openModal('createUsernameModal')())
  }
  dispatch(setLoadingMessage(''))
  dispatch(setLoading(false))
  dispatch(contactsHandlers.epics.connectWsContacts())
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

export const updateDonationAddress = () => () => {}
export const updateShieldingTax = () => () => {}
export const generateNewAddress = () => async dispatch => {
  if (!electronStore.get('addresses')) {
    electronStore.set('addresses', JSON.stringify([]))
  }
  const addresses = JSON.parse(electronStore.get('addresses'))
  const address = await client.getNewTransparentAdress()
  addresses.unshift(address)
  dispatch(setUserAddreses(addresses))
  electronStore.set('addresses', JSON.stringify(addresses))
}
export const generateNewShieldedAddress = () => async dispatch => {
  if (!electronStore.get('shieldedAddresses')) {
    electronStore.set('shieldedAddresses', JSON.stringify([]))
  }
  const addresses = JSON.parse(electronStore.get('shieldedAddresses'))
  const address = await client.getNewShieldedAdress()
  addresses.unshift(address)
  dispatch(setUserShieldedAddreses(addresses))
  electronStore.set('shieldedAddresses', JSON.stringify(addresses))
}
export const initAddreses = () => async dispatch => {
  if (!electronStore.get('addresses')) {
    electronStore.set('addresses', JSON.stringify([]))
  }
  if (!electronStore.get('shieldedAddresses')) {
    electronStore.set('shieldedAddresses', JSON.stringify([]))
  }
  const addresses = JSON.parse(electronStore.get('addresses'))
  dispatch(setUserAddreses(addresses))
  const shieldedAddreses = JSON.parse(electronStore.get('shieldedAddresses'))
  dispatch(setUserShieldedAddreses(shieldedAddreses))
}
const epics = {
  fetchBalance,
  createIdentity,
  setIdentity: setIdentityEpic,
  updateShippingData,
  createSignerKeys,
  updateDonation,
  updateDonationAddress,
  updateShieldingTax,
  fetchFreeUtxos,
  loadIdentity,
  generateNewAddress,
  generateNewShieldedAddress
}

const exportFunctions = {
  createSignerKeys
}

export const reducer = handleActions<Identity, PayloadType<IdentityActions>>(
  {
    [setLoading.toString()]: (state, { payload: loading }: IdentityActions['setLoading']) =>
      produce(state, draft => {
        draft.loader.loading = loading
      }),
    [setRemovedChannels.toString()]: (
      state,
      { payload: removedChannels }: IdentityActions['setRemovedChannels']
    ) =>
      produce(state, draft => {
        draft.removedChannels = removedChannels
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
    [setBalance.toString()]: (state, { payload: balance }: IdentityActions['setBalance']) =>
      produce(state, draft => {
        draft.data.balance = balance
      }),
    [setOnionAddress.toString()]: (
      state,
      { payload: address }: IdentityActions['setOnionAddress']
    ) =>
      produce(state, draft => {
        draft.data.onionAddress = address
      }),
    [setLockedBalance.toString()]: (
      state,
      { payload: balance }: IdentityActions['setLockedBalance']
    ) =>
      produce(state, draft => {
        draft.data.lockedBalance = balance
      }),
    [setFetchingBalance.toString()]: (
      state,
      { payload: fetching }: IdentityActions['setFetchingBalance']
    ) =>
      produce(state, draft => {
        draft.fetchingBalance = fetching
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
    [setDonationAllow.toString()]: (
      state,
      { payload: allow }: IdentityActions['setDonationAllow']
    ) =>
      produce(state, draft => {
        draft.data.donationAllow = allow
      }),
    [setDonationAddress.toString()]: (
      state,
      { payload: address }: IdentityActions['setDonationAddress']
    ) =>
      produce(state, draft => {
        draft.data.donationAddress = address
      }),
    [setShieldingTax.toString()]: (state, { payload: allow }: IdentityActions['setShieldingTax']) =>
      produce(state, draft => {
        draft.data.shieldingTax = allow
      }),
    [setFreeUtxos.toString()]: (state, { payload: freeUtxos }: IdentityActions['setFreeUtxos']) =>
      produce(state, draft => {
        draft.data.freeUtxos = freeUtxos
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
      }),
    [setUserShieldedAddreses.toString()]: (
      state,
      { payload: shieldedAddresses }: IdentityActions['setUserShieldedAddreses']
    ) =>
      produce(state, draft => {
        draft.data.shieldedAddresses = shieldedAddresses
      })
  },
  initialState
)

export default {
  actions,
  epics,
  reducer,
  exportFunctions
}
