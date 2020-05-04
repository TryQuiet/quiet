import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'
import appSelectors from '../selectors/app'
import appHandlers from './app'
import channelsSelectors from '../selectors/channels'
import feesSelectors from '../selectors/fees'
import nodeSelectors from '../selectors/node'
import { getClient } from '../../zcash'
import { errorNotification, successNotification } from './utils'
import identitySelectors from '../selectors/identity'
import notificationsHandlers from './notifications'
import { messages } from '../../zbay'
import { ADDRESS_TYPE } from '../../zbay/transit'
import txnTimestampsHandlers from '../handlers/txnTimestamps'
import txnTimestampsSelector from '../selectors/txnTimestamps'
import { getVault } from '../../vault'
import feesHandlers from '../handlers/fees'
import staticChannels from '../../zcash/channels'
import { messageType, actionTypes } from '../../../shared/static'

export const _PublicChannelData = Immutable.Record(
  {
    address: '',
    name: '',
    description: '',
    owner: '',
    timestamp: 0,
    keys: {}
  },
  'PublicChannelData'
)
export const initialState = Immutable.Map({})

export const setPublicChannels = createAction(actionTypes.SET_PUBLIC_CHANNELS)

export const actions = {
  setPublicChannels
}
export const fetchPublicChannels = () => async (dispatch, getState) => {
  try {
    const publicChannels = channelsSelectors.publicChannels(getState())
    let txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())
    const transfers = await getClient().payment.received(
      publicChannels.get('address')
    )
    if (
      transfers.length ===
      appSelectors.transfers(getState()).get(publicChannels.get('address'))
    ) {
      return
    } else {
      dispatch(
        appHandlers.actions.reduceNewTransfersCount(
          transfers.length - appSelectors.transfers(getState()).get(publicChannels.get('address'))
        )
      )
      dispatch(
        appHandlers.actions.setTransfers({
          id: publicChannels.get('address'),
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
        const message = messages.transferToMessage(transfer)
        return message
      })
    )
    const sortedMessages = registrationMessages
      .filter(msg => msg !== null)
      .sort((a, b) => txnTimestamps.get(a.id) - txnTimestamps.get(b.id))
    let minfee = 0
    let publicChannelsMap = Immutable.Map({})
    const network = nodeSelectors.network(getState())
    for (const msg of sortedMessages) {
      if (
        msg.type === messageType.CHANNEL_SETTINGS &&
        staticChannels.zbay[network].publicKey === msg.publicKey
      ) {
        minfee = parseFloat(msg.message.minFee)
      }
      if (!msg.spent.gte(minfee) || msg.type !== messageType.PUBLISH_CHANNEL) {
        continue
      }
      const updateChannelSettings = R.findLast(
        settingsMsg =>
          settingsMsg.type === messageType.CHANNEL_SETTINGS_UPDATE &&
          settingsMsg.publicKey === msg.publicKey &&
          settingsMsg.message.updateChannelAddress ===
            msg.message.channelAddress
      )(sortedMessages)
      const channel = _PublicChannelData({
        address: msg.message.channelAddress,
        name: msg.message.channelName,
        description: updateChannelSettings
          ? updateChannelSettings.message.updateChannelDescription
          : msg.message.channelDescription,
        owner: msg.publicKey,
        keys: { ivk: msg.message.channelIvk },
        timestamp: txnTimestamps.get(msg.id)
      })
      if (channel !== null && !publicChannelsMap.get(channel.name)) {
        publicChannelsMap = publicChannelsMap.merge({ [channel.name]: channel })
      }
    }
    await dispatch(feesHandlers.actions.setPublicChannelFee(minfee))
    await dispatch(setPublicChannels(publicChannelsMap))
  } catch (err) {
    console.warn(err)
  }
}
export const publishChannel = ({
  channelAddress,
  channelName,
  channelDescription,
  channelIvk
}) => async (dispatch, getState) => {
  const identityAddress = identitySelectors.address(getState())
  const privKey = identitySelectors.signerPrivKey(getState())
  const network = nodeSelectors.network(getState())
  const publicChannel = channelsSelectors.publicChannels(getState())
  const fee = feesSelectors.publicChannelfee(getState())
  const message = messages.createMessage({
    messageData: {
      type: messages.messageType.PUBLISH_CHANNEL,
      data: {
        channelName,
        channelAddress,
        channelIvk,
        channelDescription,
        networkType:
          network === 'testnet'
            ? ADDRESS_TYPE.SHIELDED_TESTNET
            : ADDRESS_TYPE.SHIELDED_MAINNET
      }
    },
    privKey: privKey
  })
  const transfer = await messages.messageToTransfer({
    message,
    address: publicChannel.get('address'),
    identityAddress,
    amount: fee
  })
  try {
    await getClient().payment.send(transfer)
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({
          message: 'Your channel has been published.'
        })
      )
    )
  } catch (err) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: "Couldn't create channel, please check node connection."
        })
      )
    )
  }
}
export const epics = {
  fetchPublicChannels,
  publishChannel
}

export const reducer = handleActions(
  {
    [setPublicChannels]: (state, { payload: publicChannels }) => {
      return state.merge(publicChannels)
    }
  },
  initialState
)

export default {
  reducer,
  epics,
  actions
}
