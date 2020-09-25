import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'
import secp256k1 from 'secp256k1'
import { randomBytes } from 'crypto'
import { DateTime } from 'luxon'

import client from '../../zcash'
import channels from '../../zcash/channels'

import identitySelectors from '../selectors/identity'
import txnTimestampsSelector from '../selectors/txnTimestamps'
// import channelsSelectors from '../selectors/channels'
// import channelsHandlers from './channels'
// import removedChannelsHandlers from './removedChannels'
// import usersHandlers from './users'
// import contactsHandlers from './contacts'
// import messagesHandlers from './messages'
// import publicChannelsHandlers from './publicChannels'
import coordinatorHandlers from './coordinator'
import whitelistHandlers from './whitelist'
import ownedChannelsHandlers from './ownedChannels'
import txnTimestampsHandlers from './txnTimestamps'
import logsHandlers from '../../store/handlers/logs'
import ratesHandlers from './rates'
import nodeHandlers from './node'
import notificationCenterHandlers from './notificationCenter'
import { LoaderState, successNotification } from './utils'
import modalsHandlers from './modals'
import notificationsHandlers from './notifications'
import messagesHandlers from './messages'
import {
  actionTypes,
  networkFeeSatoshi,
  satoshiMultiplier,
  networkFee
} from '../../../shared/static'
import electronStore, { migrationStore } from '../../../shared/electronStore'
// import app from './app'
// import channels from '../../zcash/channels'
import staticChannelsSyncHeight from '../../static/staticChannelsSyncHeight.json'

export const ShippingData = Immutable.Record(
  {
    firstName: '',
    lastName: '',
    street: '',
    country: '',
    region: '',
    city: '',
    postalCode: ''
  },
  'ShippingData'
)

const RemovedChannels = Immutable.Record(
  {
    removedChannels: Immutable.List()
  },
  'RemovedChannels'
)

const Identity = Immutable.Record(
  {
    id: null,
    address: '',
    transparentAddress: '',
    signerPrivKey: '',
    signerPubKey: '',
    name: '',
    shippingData: ShippingData(),
    balance: null,
    lockedBalance: null,
    donationAllow: true,
    shieldingTax: true,
    donationAddress: '',
    freeUtxos: 0,
    addresses: Immutable.List(),
    shieldedAddresses: Immutable.List()
  },
  'Identity'
)

// export const Identity = values => {
//   const record = _Identity(values)
//   return record.set('shippingData', ShippingData(record.shippingData))
// }

export const IdentityState = Immutable.Record(
  {
    data: Identity(),
    fetchingBalance: false,
    loader: LoaderState({ loading: false }),
    removedChannels: RemovedChannels(),
    errors: ''
  },
  'IdentityState'
)

export const initialState = IdentityState()

export const setIdentity = createAction(actionTypes.SET_IDENTITY)
export const setRemovedChannels = createAction(actionTypes.SET_REMOVED_CHANNELS)
export const setBalance = createAction(actionTypes.SET_IDENTITY_BALANCE)
export const setLockedBalance = createAction(
  actionTypes.SET_IDENTITY_LOCKED_BALANCE
)
export const setErrors = createAction(actionTypes.SET_IDENTITY_ERROR)
export const setFetchingBalance = createAction(actionTypes.SET_FETCHING_BALANCE)
export const setLoading = createAction(actionTypes.SET_IDENTITY_LOADING)
export const setLoadingMessage = createAction(
  actionTypes.SET_IDENTITY_LOADING_MESSAGE
)
export const setShippingData = createAction(
  actionTypes.SET_IDENTITY_SHIPPING_DATA
)
export const setDonationAllow = createAction(actionTypes.SET_DONATION_ALLOW)
export const setDonationAddress = createAction(actionTypes.SET_DONATION_ADDRESS)
export const setShieldingTax = createAction(actionTypes.SET_SHIELDING_TAX)
export const setFreeUtxos = createAction(actionTypes.SET_FREE_UTXOS)
export const setUserAddreses = createAction(actionTypes.SET_USER_ADDRESSES)
export const setUserShieldedAddreses = createAction(
  actionTypes.SET_USER_SHIELDED_ADDRESES
)

const actions = {
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
  setFreeUtxos
}
export const fetchAffiliateMoney = () => async (dispatch, getState) => {
  try {
    const identityAddress = identitySelectors.address(getState())
    const transfers = await client().payment.received(identityAddress)
    const affiliatesTransfers = transfers.filter(msg =>
      msg.memo.startsWith('aa')
    )
    let amount = 0
    let txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())
    for (const key in affiliatesTransfers) {
      const transfer = transfers[key]
      if (!txnTimestamps.get(transfer.txid)) {
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
    const pending = notes.pending_notes.reduce((acc, cur) => acc + cur.value, 0)
    dispatch(
      setLockedBalance(
        new BigNumber(
          (balanceObj.unverified_zbalance + pending) / satoshiMultiplier
        )
      )
    )
    dispatch(
      setBalance(
        new BigNumber(balanceObj.spendable_zbalance / satoshiMultiplier)
      )
    )
    dispatch(
      logsHandlers.epics.saveLogs({
        type: 'APPLICATION_LOGS',
        payload: `Fetching balance: locked balance: ${(balanceObj.unverified_zbalance +
          pending) /
          satoshiMultiplier}, balance: ${balanceObj.spendable_zbalance /
          satoshiMultiplier}`
      })
    )
  } catch (err) {
    dispatch(setErrors(err.message))
  } finally {
    dispatch(setFetchingBalance(false))
  }
}
export const fetchFreeUtxos = () => async (dispatch, getState) => {
  try {
    const utxos = await client.notes()
    const freeUtxos = utxos.unspent_notes.filter(
      utxo => utxo.value > networkFeeSatoshi && utxo.spendable === true
    )
    dispatch(setFreeUtxos(freeUtxos.length))
    dispatch(
      logsHandlers.epics.saveLogs({
        type: 'APPLICATION_LOGS',
        payload: `Setting free UTXOs: ${freeUtxos.length}`
      })
    )
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
export const shieldBalance = ({ to, amount }) => async (dispatch, getState) => {
  if (shielding === true) {
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

export const createIdentity = ({ name, fromMigrationFile }) => async (
  dispatch,
  getState
) => {
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
      const migrationChannels = Object.values(migrationStore.get('channels'))
      for (const channel of migrationChannels) {
        electronStore.set(`importedChannels.${channel.address}`, {
          address: channel.address,
          name: channel.name,
          description: '',
          owner: channel.keys.sk ? signerPubKey : '',
          keys: channel.keys
        })
        await client.importKey(
          channel.keys.sk ? channel.keys.sk : channel.keys.ivk
        )
      }
      migrationStore.clear()
    }
    const channelsToImport = [
      'general',
      'registeredUsers',
      'channelOfChannels',
      'store',
      'priceOracle'
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
    dispatch(
      logsHandlers.epics.saveLogs({
        type: 'APPLICATION_LOGS',
        payload: `Creating identity / importing default channels`
      })
    )
    const channelsToLoad = Object.keys(channelsWithDetails)
    for (const channel of channelsToLoad) {
      await client.importKey(
        channelsWithDetails[channel]['keys']['ivk'],
        staticChannelsSyncHeight.height
      )
    }

    setTimeout(async () => {
      console.log(await client.addresses())
    }, 0)
    setTimeout(() => {
      client.rescan()
    }, 0)
    return electronStore.get('identity')
  } catch (err) {
    console.log('error', err)
  }
}

export const loadIdentity = () => async (dispatch, getState) => {
  const identity = electronStore.get('identity')
  if (identity) {
    await dispatch(setIdentity(identity))
    dispatch(
      logsHandlers.epics.saveLogs({
        type: 'APPLICATION_LOGS',
        payload: `Loading identity`
      })
    )
  }
}

export const setIdentityEpic = (identityToSet, isNewUser) => async (
  dispatch,
  getState
) => {
  // let identity = await migrateTo_0_2_0.ensureIdentityHasKeys(identityToSet)
  let identity = identityToSet
  dispatch(setLoading(true))
  dispatch(
    logsHandlers.epics.saveLogs({
      type: 'APPLICATION_LOGS',
      payload: `Start loading identity`
    })
  )
  // const isRescanned = electronStore.get('AppStatus.blockchain.isRescanned')
  const isNewUser = electronStore.get('isNewUser')
  try {
    const removedChannels = electronStore.get('removedChannels')
    if (removedChannels) {
      const removedChannelsList = Immutable.fromJS(Object.keys(removedChannels))
      dispatch(setRemovedChannels(removedChannelsList))
    }
    dispatch(setLoadingMessage('Ensuring identity integrity'))
    await dispatch(setLoadingMessage('Ensuring node contains identity keys'))
    await dispatch(whitelistHandlers.epics.initWhitelist())
    await dispatch(notificationCenterHandlers.epics.init())
    dispatch(setLoadingMessage('Setting identity'))
    await dispatch(setIdentity(identity))
    const shippingAddress = electronStore.get('identity.shippingData')
    if (shippingAddress) {
      dispatch(setShippingData(ShippingData(shippingAddress)))
    }
    dispatch(setLoadingMessage('Fetching balance and loading channels'))
    await dispatch(initAddreses())
    dispatch(ownedChannelsHandlers.epics.getOwnedChannels())
    dispatch(ratesHandlers.epics.setInitialPrice())
    await dispatch(nodeHandlers.epics.getStatus())
    await dispatch(fetchBalance())
    await dispatch(fetchFreeUtxos())
    await dispatch(messagesHandlers.epics.fetchMessages())
    setTimeout(() => dispatch(coordinatorHandlers.epics.coordinator()), 5000)

    dispatch(setLoadingMessage('Loading users and messages'))
  } catch (err) {}
  if (isNewUser === true) {
    dispatch(modalsHandlers.actionCreators.openModal('createUsernameModal')())
  }
  // dispatch(fetchAffiliateMoney())
  dispatch(setLoading(false))
  dispatch(
    logsHandlers.epics.saveLogs({
      type: 'APPLICATION_LOGS',
      payload: ` Loading identity finished`
    })
  )
  if (electronStore.get('isMigrating')) {
    dispatch(modalsHandlers.actionCreators.openModal('migrationModal')())
  }
  // dispatch(app.actions.setInitialLoadFlag(true))
  // Don't show deposit modal if we use faucet 12.02.2020
  // const balance = identitySelectors.balance('zec')(getState())
  // const lockedBalance = identitySelectors.lockedBalance('zec')(getState())
  // if (lockedBalance.plus(balance).lt(0.0001) && newUser === false) {
  //   setTimeout(
  //     () => dispatch(modalsHandlers.actionCreators.openModal('depositMoney')()),
  //     500
  //   )
  // }
}

export const updateShippingData = (values, formActions) => async (
  dispatch,
  getState
) => {
  electronStore.set('identity.shippingData', values)
  await dispatch(setShippingData(ShippingData(values)))
  dispatch(
    notificationsHandlers.actions.enqueueSnackbar(
      successNotification({ message: 'Shipping Address Updated' })
    )
  )
  dispatch(
    logsHandlers.epics.saveLogs({
      type: 'APPLICATION_LOGS',
      payload: `Updating shipping data`
    })
  )
  formActions.setSubmitting(false)
}

export const updateDonation = allow => async (dispatch, getState) => {
  dispatch(
    notificationsHandlers.actions.enqueueSnackbar(
      successNotification({ message: 'Donation information updated' })
    )
  )
  dispatch(
    logsHandlers.epics.saveLogs({
      type: 'APPLICATION_LOGS',
      payload: `Updating donation status`
    })
  )
}

export const updateDonationAddress = address => async (dispatch, getState) => {}
export const updateShieldingTax = allow => async (dispatch, getState) => {}
export const generateNewAddress = () => async (dispatch, getState) => {
  if (!electronStore.get('addresses')) {
    electronStore.set('addresses', JSON.stringify([]))
  }
  const addresses = JSON.parse(electronStore.get('addresses'))
  const address = await client.getNewTransparentAdress()
  addresses.unshift(address)
  dispatch(setUserAddreses(Immutable.List(addresses)))
  electronStore.set('addresses', JSON.stringify(addresses))
}
export const generateNewShieldedAddress = () => async (dispatch, getState) => {
  if (!electronStore.get('shieldedAddresses')) {
    electronStore.set('shieldedAddresses', JSON.stringify([]))
  }
  const addresses = JSON.parse(electronStore.get('shieldedAddresses'))
  const address = await client.getNewShieldedAdress()
  addresses.unshift(address)
  dispatch(setUserShieldedAddreses(Immutable.List(addresses)))
  electronStore.set('shieldedAddresses', JSON.stringify(addresses))
}
export const initAddreses = () => async (dispatch, getState) => {
  if (!electronStore.get('addresses')) {
    electronStore.set('addresses', JSON.stringify([]))
  }
  if (!electronStore.get('shieldedAddresses')) {
    electronStore.set('shieldedAddresses', JSON.stringify([]))
  }
  const addresses = JSON.parse(electronStore.get('addresses'))
  dispatch(setUserAddreses(Immutable.List(addresses)))
  const shieldedAddreses = JSON.parse(electronStore.get('shieldedAddresses'))
  dispatch(setUserShieldedAddreses(Immutable.List(shieldedAddreses)))
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

export const reducer = handleActions(
  {
    [setLoading]: (state, { payload: loading }) =>
      state.setIn(['loader', 'loading'], loading),
    [setRemovedChannels]: (state, { payload: removedChannels }) =>
      state.set('removedChannels', removedChannels),
    [setLoadingMessage]: (state, { payload: message }) =>
      state.setIn(['loader', 'message'], message),
    [setIdentity]: (state, { payload: identity }) =>
      state.update('data', data => data.merge(identity)),
    [setBalance]: (state, { payload: balance }) =>
      state.update('data', data => data.set('balance', balance)),
    [setLockedBalance]: (state, { payload: balance }) =>
      state.update('data', data => data.set('lockedBalance', balance)),
    [setFetchingBalance]: (state, { payload: fetching }) =>
      state.set('fetchingBalance', fetching),
    [setErrors]: (state, { payload: errors }) => state.set('errors', errors),
    [setShippingData]: (state, { payload: shippingData }) =>
      state.setIn(['data', 'shippingData'], ShippingData(shippingData)),
    [setDonationAllow]: (state, { payload: allow }) =>
      state.setIn(['data', 'donationAllow'], allow),
    [setDonationAddress]: (state, { payload: address }) =>
      state.setIn(['data', 'donationAddress'], address),
    [setShieldingTax]: (state, { payload: allow }) =>
      state.setIn(['data', 'shieldingTax'], allow),
    [setFreeUtxos]: (state, { payload: freeUtxos }) =>
      state.setIn(['data', 'freeUtxos'], freeUtxos),
    [setUserAddreses]: (state, { payload: addresses }) =>
      state.setIn(['data', 'addresses'], addresses),
    [setUserShieldedAddreses]: (state, { payload: shieldedAddresses }) =>
      state.setIn(['data', 'shieldedAddresses'], shieldedAddresses)
  },
  initialState
)

export default {
  actions,
  epics,
  reducer,
  exportFunctions
}
