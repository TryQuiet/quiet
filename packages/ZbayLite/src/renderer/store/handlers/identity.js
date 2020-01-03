import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'
import secp256k1 from 'secp256k1'
import { randomBytes } from 'crypto'

import { getClient } from '../../zcash'
import channels from '../../zcash/channels'

import identitySelectors from '../selectors/identity'
import nodeSelectors from '../selectors/node'
import appSelectors from '../selectors/app'
import txnTimestampsSelector from '../selectors/txnTimestamps'
import channelsSelectors from '../selectors/channels'
import channelsHandlers from './channels'
import removedChannelsHandlers from './removedChannels'
import usersHandlers from './users'
import contactsHandlers from './contacts'
import messagesHandlers from './messages'
import publicChannelsHandlers from './publicChannels'
import offersHandlers from './offers'
import txnTimestampsHandlers from './txnTimestamps'
import operationHandlers, {
  operationTypes,
  ShieldBalanceOp
} from './operations'
import vaultHandlers from './vault'
import ratesHandlers from './rates'
import nodeHandlers from './node'
import vault, { getVault } from '../../vault'
import migrateTo_0_2_0 from '../../../shared/migrations/0_2_0' // eslint-disable-line camelcase
import migrateTo_0_7_0 from '../../../shared/migrations/0_7_0' // eslint-disable-line camelcase
import { LoaderState, successNotification } from './utils'
import modalsHandlers from './modals'
import notificationsHandlers from './notifications'
import { networkFee } from '../../../shared/static'

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

const _Identity = Immutable.Record(
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
    donationAddress: ''
  },
  'Identity'
)

export const Identity = values => {
  const record = _Identity(values)
  return record.set('shippingData', ShippingData(record.shippingData))
}

export const IdentityState = Immutable.Record(
  {
    data: Identity(),
    fetchingBalance: false,
    loader: LoaderState({ loading: false }),
    errors: ''
  },
  'IdentityState'
)

export const initialState = IdentityState()

export const setIdentity = createAction('SET_IDENTITY')
export const setBalance = createAction('SET_IDENTITY_BALANCE')
export const setLockedBalance = createAction('SET_IDENTITY_LOCKED_BALANCE')
export const setErrors = createAction('SET_IDENTITY_ERROR')
export const setFetchingBalance = createAction('SET_FETCHING_BALANCE')
export const setLoading = createAction('SET_IDENTITY_LOADING')
export const setLoadingMessage = createAction('SET_IDENTITY_LOADING_MESSAGE')
export const setShippingData = createAction('SET_IDENTITY_SHIPPING_DATA')
export const setDonationAllow = createAction('SET_DONATION_ALLOW')
export const setDonationAddress = createAction('SET_DONATION_ADDRESS')
export const setShieldingTax = createAction('SET_SHIELDING_TAX')

const actions = {
  setIdentity,
  setFetchingBalance,
  setErrors,
  setLoading,
  setLoadingMessage,
  setLockedBalance,
  setShippingData,
  setBalance,
  setDonationAllow,
  setDonationAddress,
  setShieldingTax
}

export const shieldBalance = ({ from, to, amount, fee }) => async (
  dispatch,
  getState
) => {
  const donationAllow = identitySelectors.donationAllow(getState())
  const network = nodeSelectors.network(getState())
  const zbay = channels.zbay[network]
  const donationAddress = identitySelectors.donationAddress(getState())
  const isAddressValid = /^t1[a-zA-Z0-9]{33}$|^ztestsapling1[a-z0-9]{75}$|^zs1[a-z0-9]{75}$|[A-Za-z0-9]{35}/.test(
    donationAddress
  )
  let transactions = []
  const taxAmount = amount.div(100).toFixed(8) // 1% tax
  const newAmount = amount.minus(taxAmount).toFixed(8)
  if (donationAllow === 'true') {
    transactions.push({
      address: isAddressValid ? donationAddress : zbay.address,
      amount: taxAmount.toString()
    })
    transactions.push({
      address: to,
      amount: newAmount.toString()
    })
  } else {
    transactions.push({
      address: to,
      amount: amount.toString()
    })
  }
  const opId = await getClient().payment.send({
    from,
    amounts: transactions,
    fee
  })
  dispatch(
    notificationsHandlers.actions.enqueueSnackbar(
      successNotification({
        message: `You will soon recive ${newAmount.toString()} from your transparent address`
      })
    )
  )
  dispatch(
    operationHandlers.epics.observeOperation({
      opId,
      type: operationTypes.shieldBalance,
      meta: ShieldBalanceOp({
        amount,
        from,
        to
      })
    })
  )
}
export const fetchAffiliateMoney = () => async (dispatch, getState) => {
  try {
    const identityAddress = identitySelectors.address(getState())
    const transfers = await getClient().payment.received(identityAddress)
    const identityId = identitySelectors.id(getState())
    const affiliatesTransfers = transfers.filter(msg =>
      msg.memo.startsWith('aa')
    )
    let amount = 0
    let txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())
    for (const key in affiliatesTransfers) {
      const transfer = transfers[key]
      if (!txnTimestamps.get(transfer.txid)) {
        amount += transfer.amount
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
    if (amount) {
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar(
          successNotification({
            message: `You recived ${amount} ZEC from your affiliates`
          })
        )
      )
    }
    vault.identity.updateLastLogin(identityId)
  } catch (err) {}
}
export const fetchBalance = () => async (dispatch, getState) => {
  const fee = networkFee
  dispatch(setFetchingBalance(true))
  const address = identitySelectors.address(getState())
  const tAddress = identitySelectors.transparentAddress(getState())
  try {
    const balance = await getClient().accounting.balance(address)
    const transparentBalance = await getClient().accounting.balance(tAddress)
    const realTBalance = transparentBalance.minus(fee)
    const lockedBalanceNotes = await getClient().payment.unspentNotes({
      addresses: [address],
      minConfirmations: 0,
      maxConfirmations: 0
    })
    const lockedBalance = lockedBalanceNotes.reduce(
      (acc, current) => acc.plus(new BigNumber(current.amount || 0)),
      new BigNumber(0)
    )
    if (realTBalance.gt(0)) {
      await dispatch(
        shieldBalance({
          from: tAddress,
          to: address,
          amount: realTBalance,
          fee
        })
      )
    }
    dispatch(setLockedBalance(lockedBalance))
    dispatch(setBalance(balance))
  } catch (err) {
    dispatch(setErrors(err.message))
  } finally {
    dispatch(setFetchingBalance(false))
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

export const createIdentity = ({ name }) => async (dispatch, getState) => {
  try {
    const [{ value: address }, transparentAddress] = await Promise.all([
      dispatch(nodeHandlers.actions.createAddress()),
      getClient().addresses.createTransparent()
    ])
    const [tpk, sk] = await Promise.all([
      await getClient().keys.exportTPK(transparentAddress),
      await getClient().keys.exportSK(address)
    ])

    const { signerPrivKey, signerPubKey } = exportFunctions.createSignerKeys()

    const { value: identity } = await dispatch(
      vaultHandlers.actions.createIdentity({
        name,
        address,
        transparentAddress,
        signerPubKey,
        signerPrivKey,
        keys: {
          tpk,
          sk
        }
      })
    )

    const network = nodeSelectors.network(getState())
    const generalChannel = channels.general[network]
    const usersChannel = channels.registeredUsers[network]
    const channelOfChannels = channels.channelOfChannels[network]
    await getVault().channels.importChannel(identity.id, generalChannel)
    await getVault().channels.importChannel(identity.id, usersChannel)
    await getVault().channels.importChannel(identity.id, channelOfChannels)
    await getClient().keys.importIVK({
      ivk: generalChannel.keys.ivk,
      address: generalChannel.address
    })
    return identity
  } catch (err) {
    dispatch(setErrors(err))
  }
}

export const setIdentityEpic = identityToSet => async (dispatch, getState) => {
  dispatch(setLoading(true))
  try {
    dispatch(setLoadingMessage('Ensuring identity integrity'))
    let identity = await migrateTo_0_2_0.ensureIdentityHasKeys(identityToSet)
    // Make sure identity is handled by the node
    await dispatch(setLoadingMessage('Ensuring node contains identity keys'))

    await dispatch(channelsHandlers.actions.loadChannelsToNode(identity.id))
    await getClient().keys.importSK({ sk: identity.keys.sk, rescan: 'no' })
    await getClient().keys.importTPK(identity.keys.tpk)

    dispatch(setLoadingMessage('Setting identity'))
    // Check if identity has signerKeys
    if (!identity.signerPrivKey || !identity.signerPubKey) {
      const { signerPrivKey, signerPubKey } = createSignerKeys()
      const { value: updatedIdentity } = await dispatch(
        vaultHandlers.actions.updateIdentitySignerKeys({
          id: identity.id,
          signerPubKey,
          signerPrivKey
        })
      )
      identity = updatedIdentity
    }
    await dispatch(setIdentity(identity))
    await dispatch(txnTimestampsHandlers.epics.getTnxTimestamps())
    dispatch(removedChannelsHandlers.epics.getRemovedChannelsTimestamp())
    const network = nodeSelectors.network(getState())
    await migrateTo_0_7_0.ensureDefaultChannels(identity, network)
    dispatch(setLoadingMessage('Fetching balance and loading channels'))
    dispatch(ratesHandlers.epics.fetchPrices())
    await dispatch(fetchBalance())
    dispatch(setLoadingMessage('Loading users and messages'))
    await dispatch(usersHandlers.epics.fetchUsers())
    await dispatch(contactsHandlers.epics.loadAllSentMessages())
    const channels = channelsSelectors
      .data(getState())
      .map(channel => () => messagesHandlers.epics.fetchMessages(channel))
    for (let i = 0; i < channels.size; i++) {
      await dispatch(channels.get(i)())
    }
    await dispatch(offersHandlers.epics.loadVaultContacts())
    await dispatch(offersHandlers.epics.initMessage())
    await dispatch(contactsHandlers.epics.fetchMessages())
    await dispatch(publicChannelsHandlers.epics.fetchPublicChannels())
    await dispatch(channelsHandlers.epics.withdrawMoneyFromChannels())
  } catch (err) {}
  dispatch(setLoading(false))

  const balance = identitySelectors.balance('zec')(getState())
  const lockedBalance = identitySelectors.lockedBalance('zec')(getState())
  const newUser = appSelectors.newUser(getState())
  if (lockedBalance.plus(balance).lt(0.0001) && newUser === false) {
    setTimeout(
      () => dispatch(modalsHandlers.actionCreators.openModal('depositMoney')()),
      500
    )
  }
  dispatch(fetchAffiliateMoney())
}

export const updateShippingData = (values, formActions) => async (
  dispatch,
  getState
) => {
  const id = identitySelectors.id(getState())
  const identity = await vault.identity.updateShippingData(id, values)
  await dispatch(setShippingData(identity.shippingData))
  dispatch(
    notificationsHandlers.actions.enqueueSnackbar(
      successNotification({ message: 'Shipping Address Updated' })
    )
  )
  formActions.setSubmitting(false)
}

export const updateDonation = allow => async (dispatch, getState) => {
  const id = identitySelectors.id(getState())
  const identity = await vault.identity.updateDonation(id, allow)
  await dispatch(setDonationAllow(identity.donationAllow))
  dispatch(
    notificationsHandlers.actions.enqueueSnackbar(
      successNotification({ message: 'Donation informations updated' })
    )
  )
}

export const updateDonationAddress = address => async (dispatch, getState) => {
  const id = identitySelectors.id(getState())
  await vault.identity.updateDonationAddress(id, address)
}
export const updateShieldingTax = allow => async (dispatch, getState) => {
  const id = identitySelectors.id(getState())
  const identity = await vault.identity.updateShieldingTax(id, allow)
  await dispatch(setShieldingTax(identity.shieldingTax))
}

const epics = {
  fetchBalance,
  createIdentity,
  setIdentity: setIdentityEpic,
  updateShippingData,
  createSignerKeys,
  updateDonation,
  updateDonationAddress,
  updateShieldingTax
}

const exportFunctions = {
  createSignerKeys
}

export const reducer = handleActions(
  {
    [setLoading]: (state, { payload: loading }) =>
      state.setIn(['loader', 'loading'], loading),
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
      state.setIn(['data', 'shieldingTax'], allow)
  },
  initialState
)

export default {
  actions,
  epics,
  reducer,
  exportFunctions
}
