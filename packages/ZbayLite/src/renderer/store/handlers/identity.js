import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'
import secp256k1 from 'secp256k1'
import { randomBytes } from 'crypto'

import { getClient } from '../../zcash'
import channels from '../../zcash/channels'

import identitySelectors from '../selectors/identity'
import nodeSelectors from '../selectors/node'
import channelsHandlers from './channels'
import operationHandlers, { operationTypes, ShieldBalanceOp } from './operations'
import vaultHandlers from './vault'
import nodeHandlers from './node'
import { getVault } from '../../vault'
import migrateTo_0_2_0 from '../../../shared/migrations/0_2_0' // eslint-disable-line camelcase
import migrateTo_0_7_0 from '../../../shared/migrations/0_7_0' // eslint-disable-line camelcase
import { LoaderState } from './utils'

export const Identity = Immutable.Record({
  id: null,
  address: '',
  transparentAddress: '',
  signerPrivKey: '',
  signerPubKey: '',
  name: '',
  balance: null,
  lockedBalance: null
}, 'Identity')

export const IdentityState = Immutable.Record({
  data: Identity(),
  fetchingBalance: false,
  loader: LoaderState({ loading: true }),
  errors: ''
}, 'IdentityState')

export const initialState = IdentityState()

export const setIdentity = createAction('SET_IDENTITY')
export const setBalance = createAction('SET_IDENTITY_BALANCE')
export const setLockedBalance = createAction('SET_IDENTITY_LOCKED_BALANCE')
export const setErrors = createAction('SET_IDENTITY_ERROR')
export const setFetchingBalance = createAction('SET_FETCHING_BALANCE')
export const setLoading = createAction('SET_IDENTITY_LOADING')
export const setLoadingMessage = createAction('SET_IDENTITY_LOADING_MESSAGE')

const actions = {
  setIdentity,
  setFetchingBalance,
  setErrors,
  setLoading,
  setLoadingMessage,
  setLockedBalance,
  setBalance
}

export const shieldBalance = ({ from, to, amount, fee }) => async (dispatch, getState) => {
  const opId = await getClient().payment.send({
    from,
    amounts: [{
      address: to,
      amount: amount.toString()
    }],
    fee
  })
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

export const fetchBalance = () => async (dispatch, getState) => {
  const fee = 0.0001
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
      await dispatch(shieldBalance({
        from: tAddress,
        to: address,
        amount: realTBalance,
        fee
      }))
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
    signerPrivKey: signerPrivKey,
    signerPubKey: secp256k1.publicKeyCreate(signerPrivKey, true)
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

    const { value: identity } = await dispatch(vaultHandlers.actions.createIdentity({
      name,
      address,
      transparentAddress,
      signerPubKey,
      signerPrivKey,
      keys: {
        tpk,
        sk
      }
    }))

    const network = nodeSelectors.network(getState())
    const generalChannel = channels.general[network]
    const usersChannel = channels.registeredUsers[network]
    await getVault().channels.importChannel(identity.id, generalChannel)
    await getVault().channels.importChannel(identity.id, usersChannel)
    await getClient().keys.importIVK({
      ivk: generalChannel.keys.ivk,
      address: generalChannel.address
    })
    return identity
  } catch (err) {
    dispatch(setErrors(err))
  }
}

export const setIdentityEpic = (identityToSet) => async (dispatch, getState) => {
  dispatch(setLoading(true))
  try {
    dispatch(setLoadingMessage('Ensuring identity integrity'))
    let identity = await migrateTo_0_2_0.ensureIdentityHasKeys(identityToSet)
    // Make sure identity is handled by the node
    dispatch(setLoadingMessage('Ensuring node contains identity keys'))
    await Promise.all([
      getClient().keys.importSK({ sk: identity.keys.sk }),
      getClient().keys.importTPK(identity.keys.tpk)
    ])

    dispatch(setLoadingMessage('Setting identity'))
    // Check if identity has signerKeys
    if (!identity.signerPrivKey || !identity.signerPubKey) {
      const { signerPrivKey, signerPubKey } = createSignerKeys()
      const { value: updatedIdentity } = await dispatch(vaultHandlers.actions.updateIdentitySignerKeys({
        id: identity.id,
        signerPubKey,
        signerPrivKey
      }))
      identity = updatedIdentity
    }
    dispatch(setIdentity(identity))
    const network = nodeSelectors.network(getState())
    await migrateTo_0_7_0.ensureDefaultChannels(identity, network)
    dispatch(setLoadingMessage('Fetching balance and loading channels'))
    await Promise.all([
      dispatch(fetchBalance()),
      dispatch(channelsHandlers.actions.loadChannels(identity.id))
    ])
  } catch (err) {
  }
  dispatch(setLoading(false))
}

const epics = {
  fetchBalance,
  createIdentity,
  setIdentity: setIdentityEpic,
  createSignerKeys
}

const exportFunctions = {
  createSignerKeys
}

export const reducer = handleActions({
  [setLoading]: (state, { payload: loading }) => state.setIn(['loader', 'loading'], loading),
  [setLoadingMessage]: (state, { payload: message }) => state.setIn(['loader', 'message'], message),
  [setIdentity]: (state, { payload: identity }) => state.update(
    'data',
    data => data.merge(identity)
  ),
  [setBalance]: (state, { payload: balance }) => state.update(
    'data',
    data => data.set('balance', balance)
  ),
  [setLockedBalance]: (state, { payload: balance }) => state.update(
    'data',
    data => data.set('lockedBalance', balance)
  ),
  [setFetchingBalance]: (state, { payload: fetching }) => state.set('fetchingBalance', fetching),
  [setErrors]: (state, { payload: errors }) => state.set('errors', errors)
}, initialState)

export default {
  actions,
  epics,
  reducer,
  exportFunctions
}
