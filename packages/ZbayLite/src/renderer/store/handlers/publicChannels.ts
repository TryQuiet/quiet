import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import * as R from 'ramda'
import feesSelectors from '../selectors/fees'
import nodeSelectors from '../selectors/node'
import client from '../../zcash'
import { errorNotification, successNotification } from './utils'
import identitySelectors from '../selectors/identity'
import notificationsHandlers from './notifications'
import { publicChannelsActions } from '../../sagas/publicChannels/publicChannels.reducer'
import messagesOperators from '../../zbay/messages'
import { ADDRESS_TYPE } from '../../zbay/transit'
import feesHandlers from './fees'
import staticChannels from '../../zcash/channels'
import { messageType, actionTypes } from '../../../shared/static'
import { ActionsType, PayloadType } from './types'
import { DisplayableMessage } from '../../zbay/messages.types'
import contactsSelectors from '../selectors/contacts'
import publicChannelsSelectors from '../selectors/publicChannels'
import debug from 'debug'
const log = Object.assign(debug('zbay:channels'), {
  error: debug('zbay:channels:err')
})

// Used only in some tests
export const _PublicChannelData = {
  address: '',
  name: '',
  description: '',
  owner: '',
  timestamp: 0,
  keys: {}
}

export class PublicChannel {
  address: string
  name: string
  description: string
  owner: string
  keys: { ivk?: string; sk?: string }
  timestamp: number

  constructor(values: Partial<PublicChannel>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export interface PublicChannelsStore {
  [name: string]: PublicChannel
}

export const initialState: PublicChannelsStore = {}

export const setPublicChannels = createAction<{ [name: string]: PublicChannel }>(
  actionTypes.SET_PUBLIC_CHANNELS
)

export const clearPublicChannels = createAction(
  actionTypes.CLEAR_PUBLIC_CHANNELS
)

export const actions = {
  setPublicChannels,
  clearPublicChannels
}

export type PublicChannelsActions = ActionsType<typeof actions>

export const fetchPublicChannels = (messages: DisplayableMessage[]) => async dispatch => {
  try {
    const filteredZbayMessages = messages.filter(msg => msg.memohex.startsWith('ff'))

    const registrationMessages: DisplayableMessage[] = await Promise.all(
      filteredZbayMessages.map(async transfer => {
        const message = messagesOperators.transferToMessage(transfer)
        return await message
      })
    )
    const sortedMessages = registrationMessages.filter(msg => msg !== null)
    let minfee = 0
    let publicChannelsMap = {}
    const network = nodeSelectors.network()
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
        (settingsMsg: DisplayableMessage) =>
          settingsMsg.type === messageType.CHANNEL_SETTINGS_UPDATE &&
          settingsMsg.publicKey === msg.publicKey &&
          settingsMsg.message.updateChannelAddress === msg.message.channelAddress
      )(sortedMessages)
      const channel = new PublicChannel({
        address: msg.message.channelAddress,
        name: msg.message.channelName,
        description: updateChannelSettings
          ? updateChannelSettings.message.updateChannelDescription
          : msg.message.channelDescription,
        owner: msg.publicKey,
        keys: { ivk: msg.message.channelIvk },
        timestamp: msg.createdAt
      })
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
    await dispatch(setPublicChannels(publicChannelsMap))
  } catch (err) {
    console.warn(err)
  }
}

export const updatePublicChannels = (channels) => async dispatch => {
  await dispatch(setPublicChannels(channels))
}

export const loadPublicChannels = () => async dispatch => {
  /** Get public channels from db */
  await dispatch(publicChannelsActions.getPublicChannels())
}

export const subscribeForPublicChannels = () => async (dispatch, getState) => {
  /** Subscribe for public channels from contacts (joined public channels) */
  const publicChannelsContacts = contactsSelectors.publicChannelsContacts(getState())
  for (const publicChannel of publicChannelsContacts) {
    const channel = publicChannelsSelectors.publicChannelsByName(publicChannel.username)(getState())
    log('subscribing for ', channel.name)
    if (channel) {
      dispatch(publicChannelsActions.subscribeForTopic(channel))
    }
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
  const network = nodeSelectors.network()
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
          network === 'testnet' ? ADDRESS_TYPE.SHIELDED_TESTNET : ADDRESS_TYPE.SHIELDED_MAINNET
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
  publishChannel,
  updatePublicChannels,
  loadPublicChannels,
  subscribeForPublicChannels
}

export const reducer = handleActions<PublicChannelsStore, PayloadType<PublicChannelsActions>>(
  {
    [setPublicChannels.toString()]: (
      state,
      { payload: publicChannels }: PublicChannelsActions['setPublicChannels']
    ) =>
      produce(state, draft => {
        return {
          ...draft,
          ...publicChannels
        }
      }),
    [clearPublicChannels.toString()]: (
      state
    ) =>
      produce(state, () => {
        return {}
      })
  },
  initialState
)

export default {
  reducer,
  epics,
  actions
}
