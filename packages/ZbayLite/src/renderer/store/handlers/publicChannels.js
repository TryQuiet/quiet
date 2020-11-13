import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'
import feesSelectors from '../selectors/fees'
import nodeSelectors from '../selectors/node'
import client from '../../zcash'
import { errorNotification, successNotification } from './utils'
import identitySelectors from '../selectors/identity'
import notificationsHandlers from './notifications'
import messagesOperators from '../../zbay/messages'
import { ADDRESS_TYPE } from '../../zbay/transit'
import feesHandlers from '../handlers/fees'
import staticChannels from '../../zcash/channels'
import { messageType, actionTypes } from '../../../shared/static'

export const _PublicChannelData = {
  address: '',
  name: '',
  description: '',
  owner: '',
  timestamp: 0,
  keys: {}
}
export const initialState = {}

export const setPublicChannels = createAction(actionTypes.SET_PUBLIC_CHANNELS)

export const actions = {
  setPublicChannels
}
export const fetchPublicChannels = (address, messages) => async (dispatch, getState) => {
  try {
    const filteredZbayMessages = messages.filter(msg =>
      msg.memohex.startsWith('ff')
    )

    const registrationMessages = await Promise.all(
      filteredZbayMessages.map(transfer => {
        const message = messagesOperators.transferToMessage(transfer)
        return message
      })
    )
    const sortedMessages = registrationMessages
      .filter(msg => msg !== null)
    let minfee = 0
    let publicChannelsMap = {}
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
      const channel = {
        address: msg.message.channelAddress,
        name: msg.message.channelName,
        description: updateChannelSettings
          ? updateChannelSettings.message.updateChannelDescription
          : msg.message.channelDescription,
        owner: msg.publicKey,
        keys: { ivk: msg.message.channelIvk },
        timestamp: msg.createdAt
      }
      if (channel !== null && !publicChannelsMap[channel.name]) {
        publicChannelsMap = {
          ...publicChannelsMap,
          [channel.name]: {
            ...channel
          }
        }
      }
    }
    await dispatch(feesHandlers.actions.setPublicChannelFee(minfee))
    console.log('tes public channelst', publicChannelsMap)
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
  const fee = feesSelectors.publicChannelfee(getState())
  const message = messagesOperators.createMessage({
    messageData: {
      type: messagesOperators.messageType.PUBLISH_CHANNEL,
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
  const transfer = await messagesOperators.messageToTransfer({
    message,
    address: staticChannels.channelOfChannels[network].address,
    identityAddress,
    amount: fee
  })
  try {
    const txid = await client.sendTransaction(transfer)
    if (txid.error) {
      throw new Error(txid.error)
    }
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
    [setPublicChannels]: (state, { payload: publicChannels }) => produce(state, (draft) => {
      return {
        ...draft,
        ...publicChannels
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
