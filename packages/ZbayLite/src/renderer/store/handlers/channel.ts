import { produce, immerable } from 'immer'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'
import { remote } from 'electron'
import { DateTime } from 'luxon'

import history from '../../../shared/history'
import operationsHandlers from './operations'
import notificationsHandlers from './notifications'
import messagesHandlers, { _checkMessageSize } from './messages'
import channelsHandlers from './channels'
import offersHandlers from './offers'
import channelSelectors from '../selectors/channel'
import identitySelectors from '../selectors/identity'
import contactsSelectors from '../selectors/contacts'
import directMessagesSelectors from '../selectors/directMessages'
import directMessagesHandlers from '../handlers/directMessages'
import client from '../../zcash'
import { messages } from '../../zbay'
import { errorNotification } from './utils'
import { messageType, actionTypes } from '../../../shared/static'
import { DisplayableMessage } from '../../zbay/messages.types'
import contactsHandlers from './contacts'
import electronStore from '../../../shared/electronStore'
import { channelToUri } from '../../zbay/channels'

import { ActionsType, PayloadType } from './types'
import { publicChannelsActions } from '../../sagas/publicChannels/publicChannels.reducer'
import { directMessagesActions } from '../../sagas/directMessages/directMessages.reducer'

// TODO: to remove, but must be replaced in all the tests
export const ChannelState = {
  spentFilterValue: new BigNumber(0),
  id: null,
  message: {},
  shareableUri: '',
  address: '',
  loader: {
    loading: false,
    message: ''
  },
  members: null,
  showInfoMsg: true,
  isSizeCheckingInProgress: false,
  messageSizeStatus: null,
  displayableMessageLimit: 50
}
interface ILoader {
  loading: boolean
  message?: string
}

// TODO: find type of message and members
export class Channel {
  spentFilterValue: BigNumber
  id?: string
  message: object
  shareableUri: string
  address: string
  loader: ILoader
  members?: object
  showInfoMsg: boolean
  isSizeCheckingInProgress: boolean
  messageSizeStatus?: boolean
  displayableMessageLimit: number

  constructor(values?: Partial<Channel>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: Channel = new Channel({
  spentFilterValue: new BigNumber(0),
  message: {},
  shareableUri: '',
  address: '',
  loader: { loading: false, message: '' },
  members: {},
  showInfoMsg: true,
  isSizeCheckingInProgress: false,
  displayableMessageLimit: 50
})

const setLoading = createAction<boolean>(actionTypes.SET_CHANNEL_LOADING)
const setSpentFilterValue = createAction(actionTypes.SET_SPENT_FILTER_VALUE, (_, value) => value)
const setMessage = createAction<{ value: string; id: string }>(actionTypes.SET_CHANNEL_MESSAGE)
const setChannelId = createAction<string>(actionTypes.SET_CHANNEL_ID)
const isSizeCheckingInProgress = createAction<boolean>(actionTypes.IS_SIZE_CHECKING_IN_PROGRESS)
const messageSizeStatus = createAction<boolean>(actionTypes.MESSAGE_SIZE_STATUS)
const setShareableUri = createAction<string>(actionTypes.SET_CHANNEL_SHAREABLE_URI)
const setDisplayableLimit = createAction<number>(actionTypes.SET_DISPLAYABLE_LIMIT)
const setAddress = createAction<string>(actionTypes.SET_CHANNEL_ADDRESS)
const resetChannel = createAction(actionTypes.SET_CHANNEL)

export const actions = {
  setLoading,
  setSpentFilterValue,
  setMessage,
  setShareableUri,
  setChannelId,
  resetChannel,
  isSizeCheckingInProgress,
  setAddress,
  messageSizeStatus,
  setDisplayableLimit
}

export type ChannelActions = ActionsType<typeof actions>

const loadChannel = key => async (dispatch, getState) => {
  try {
    dispatch(setChannelId(key))
    dispatch(setDisplayableLimit(30))
    // Calculate URI on load, that way it won't be outdated, even if someone decides
    // to update channel in vault manually
    const contact = contactsSelectors.contact(key)(getState())
    const unread = contact.newMessages.length
    remote.app.setBadgeCount(remote.app.getBadgeCount() - unread)
    const ivk =
      electronStore.get(`defaultChannels.${contact.address}.keys.ivk`) ||
      electronStore.get(`importedChannels.${contact.address}.keys.ivk`)
    if (ivk) {
      const uri = await channelToUri({
        name: contact.username,
        ivk
      })
      dispatch(setShareableUri(uri))
    }
    electronStore.set(`lastSeen.${key}`, `${Math.floor(DateTime.utc().toSeconds())}`)
    dispatch(setAddress(contact.address))

    dispatch(contactsHandlers.actions.cleanNewMessages({ contactAddress: key }))
    // await dispatch(clearNewMessages())
    // await dispatch(updateLastSeen())
  } catch (err) { }
}
const loadOffer = (id, address) => async dispatch => {
  try {
    await dispatch(offersHandlers.epics.updateLastSeen({ itemId: id }))
    dispatch(setChannelId(id))
    dispatch(setShareableUri(''))
    dispatch(setAddress(address))
  } catch (err) { }
}
const linkChannelRedirect = targetChannel => async (dispatch, getState) => {
  const contact = contactsSelectors.contact(targetChannel.address)(getState())
  if (targetChannel.name === 'zbay') {
    history.push('/main/channel/zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00')
    return
  }
  if (contact.address) {
    history.push(`/main/channel/${targetChannel.address}`)
    return
  }
  electronStore.set(`channelsToRescan.${targetChannel.address}`, true)
  const importedChannels = electronStore.get('importedChannels') || {}
  electronStore.set('importedChannels', {
    ...importedChannels,
    [targetChannel.address]: {
      address: targetChannel.address,
      name: targetChannel.name,
      description: targetChannel.description,
      owner: targetChannel.owner,
      keys: targetChannel.keys
    }
  })
  // We can parse timestamp to blocktime and get accurate birthday block for this channel
  // Skipped since we dont support rescaning also we already got birthday of zbay as main wallet birthday
  await client.importKey(targetChannel.keys.ivk)
  dispatch(publicChannelsActions.subscribeForTopic(targetChannel))
  await dispatch(
    contactsHandlers.actions.addContact({
      key: targetChannel.address,
      contactAddress: targetChannel.address,
      username: targetChannel.name
    })
  )

  history.push(`/main/channel/${targetChannel.address}`)
}

const sendOnEnter = (_event, resetTab?: (arg: number) => void) => async (dispatch, getState) => {
  if (resetTab) {
    resetTab(0)
  }
  const isPublicChannel = channelSelectors.isPublicChannel(getState())
  const isDirectMessageChannel = channelSelectors.isDirectMessage(getState())
  console.log(`isPublicChannel? ${isPublicChannel}`)
  if (isPublicChannel) {
    dispatch(publicChannelsActions.sendMessage())
    return
  }
  console.log(`isDM? ${isDirectMessageChannel}`)
  if (isDirectMessageChannel) {
    const id = channelSelectors.id(getState())
    const conversations: Array<{ contactPublicKey: string }> = directMessagesSelectors.conversations(getState())

    const conversation = Array.from(Object.values(conversations)).filter(conv => {
      return conv.contactPublicKey === id
    })

    if (!conversation[0]) {
      console.log('INITIALIZING XONVE')
      await dispatch(directMessagesHandlers.epics.initializeConversation())
    }
    dispatch(directMessagesActions.sendDirectMessage())
  }
}
const sendChannelSettingsMessage = ({ address, minFee = '0', onlyRegistered = '0' }) => async (
  dispatch,
  getState
) => {
  const identityAddress = identitySelectors.address(getState())
  const owner = identitySelectors.signerPubKey(getState())
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = messages.createMessage({
    messageData: {
      type: messageType.CHANNEL_SETTINGS,
      data: {
        owner,
        minFee,
        onlyRegistered
      }
    },
    privKey: privKey
  })
  const transfer = await messages.messageToTransfer({
    message,
    address: address,
    identityAddress
  })
  try {
    const txid = await client.sendTransaction(transfer)
    if (txid.error) {
      throw new Error(txid.error)
    }
    return 1
  } catch (err) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: "Couldn't create channel, please check node connection."
        })
      )
    )
    return -1
  }
}

const resendMessage = messageData => async (dispatch, getState) => {
  const identityAddress = identitySelectors.address(getState())
  const channel = channelSelectors.data(getState())
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = messages.createMessage({
    messageData: {
      type: messageData.type,
      data: messageData.message,
      spent: parseFloat(messageData.spent.toString())
    },
    privKey
  })
  const transfer = await messages.messageToTransfer({
    message,
    address: channel.address,
    amount: parseFloat(messageData.spent.toString()),
    identityAddress
  })
  const messagePlaceholder = new DisplayableMessage({
    ...messageData,
    status: 'pending'
  })
  dispatch(
    contactsHandlers.actions.addMessage({
      key: channel.key,
      message: { [messageData.id]: messagePlaceholder }
    })
  )
  const transaction = await client.sendTransaction(transfer)
  if (!transaction.txid) {
    dispatch(
      contactsHandlers.actions.addMessage({
        key: channel.key,
        message: {
          [messageData.id]: {
            ...messagePlaceholder,
            status: 'failed'
          }
        }
      })
    )
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: "Couldn't send the message, please check node connection."
        })
      )
    )
    return
  }
  dispatch(
    operationsHandlers.epics.resolvePendingOperation({
      channelId: channel.key,
      id: messageData.id,
      txid: transaction.txid
    })
  )
}

const updateLastSeen = () => async (dispatch, getState) => {
  const channelId = channelSelectors.channelId(getState())
  return dispatch(channelsHandlers.epics.updateLastSeen({ channelId }))
}

const clearNewMessages = () => async (dispatch, getState) => {
  const channelId = channelSelectors.channelId(getState())
  dispatch(messagesHandlers.actions.cleanNewMessages({ channelId }))
}

// TODO: we should have a global loader map
export const reducer = handleActions<Channel, PayloadType<ChannelActions>>(
  {
    [setLoading.toString()]: (state, { payload: loading }: ChannelActions['setLoading']) =>
      produce(state, draft => {
        draft.loader.loading = loading
      }),
    [setSpentFilterValue.toString()]: (
      state,
      { payload: value }: ChannelActions['setSpentFilterValue']
    ) =>
      produce(state, draft => {
        draft.spentFilterValue = new BigNumber(value)
      }),
    [setMessage.toString()]: (state, { payload: { value, id } }: ChannelActions['setMessage']) =>
      produce(state, draft => {
        draft.message[id] = value
      }),
    [setChannelId.toString()]: (state, { payload: id }: ChannelActions['setChannelId']) =>
      produce(state, draft => {
        draft.id = id
      }),
    [isSizeCheckingInProgress.toString()]: (
      state,
      { payload }: ChannelActions['isSizeCheckingInProgress']
    ) =>
      produce(state, draft => {
        draft.isSizeCheckingInProgress = payload
      }),
    [messageSizeStatus.toString()]: (state, { payload }: ChannelActions['messageSizeStatus']) =>
      produce(state, draft => {
        draft.messageSizeStatus = payload
      }),
    [setShareableUri.toString()]: (state, { payload: uri }: ChannelActions['setShareableUri']) =>
      produce(state, draft => {
        draft.shareableUri = uri
      }),
    [setDisplayableLimit.toString()]: (
      state,
      { payload: limit }: ChannelActions['setDisplayableLimit']
    ) =>
      produce(state, draft => {
        draft.displayableMessageLimit = limit
      }),
    [setAddress.toString()]: (state, { payload: address }: ChannelActions['setAddress']) =>
      produce(state, draft => {
        draft.address = address
      }),
    [resetChannel.toString()]: () => initialState
  },
  initialState
)

export const epics = {
  sendOnEnter,
  loadChannel,
  resendMessage,
  clearNewMessages,
  updateLastSeen,
  loadOffer,
  sendChannelSettingsMessage,
  linkChannelRedirect
}

export default {
  reducer,
  epics,
  actions
}
