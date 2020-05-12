import BigNumber from 'bignumber.js'

import identitySelectors from '../selectors/identity'
import channelSelectors from '../selectors/channel'
import directMessageChannelSelectors from '../selectors/directMessageChannel'
import offersHandlers from '../../store/handlers/offers'
import { messages } from '../../zbay'
import { getClient } from '../../zcash'
import notificationsHandlers from './notifications'
import directMessagesQueueHandlers, {
  checkConfirmationNumber
} from './directMessagesQueue'
import { errorNotification, successNotification } from './utils'
import operationsHandlers, { operationTypes } from './operations'
import contactsHandlers from './contacts'
import { messageType } from '../../../shared/static'

const handleSend = ({ values }) => async (dispatch, getState) => {
  const data = {
    tag: values.tag,
    background: values.background.toString(),
    title: values.title,
    provideShipping: values.shippingInfo ? '1' : '0',
    amount: values.usd,
    description: values.description
  }
  const identityAddress = identitySelectors.address(getState())
  const channel =
    channelSelectors.data(getState()) &&
    channelSelectors.data(getState()).toJS()
  const directChannelAddress = directMessageChannelSelectors.targetRecipientAddress(
    getState()
  )
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = messages.createMessage({
    messageData: {
      type: messageType.AD,
      data: data,
      spent: channel ? channel.advertFee.toString() : '0'
    },
    privKey
  })
  const transfer = await messages.messageToTransfer({
    message,
    address: channel ? channel.address : directChannelAddress,
    identityAddress
  })
  try {
    const opId = await getClient().payment.send(transfer)
    await dispatch(
      operationsHandlers.epics.observeOperation({
        opId,
        type: channel
          ? operationTypes.pendingMessage
          : operationTypes.pendingDirectMessage,
        meta: {
          message: message,
          channelId: channel ? channel.id : 'none',
          recipientAddress: channel ? 'none' : directChannelAddress,
          saveAdvert: !channel
        },
        checkConfirmationNumber: channel ? null : checkConfirmationNumber
      })
    )
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({ message: 'Offer successfully posted' })
      )
    )
  } catch (err) {
    console.log(err)
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: "Couldn't send the message, please check node connection."
        })
      )
    )
  }
}

const handleSendTransfer = ({ values, history, payload }) => async (
  dispatch,
  getState
) => {
  const shippingData = identitySelectors.shippingData(getState())
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = messages.createMessage({
    messageData: {
      type: messageType.ITEM_TRANSFER,
      data: {
        itemId: payload.id.substring(0, 64),
        tag: payload.tag,
        offerOwner: payload.offerOwner,
        shippingData
      },
      spent: new BigNumber(values.zec)
    },
    privKey
  })
  dispatch(offersHandlers.epics.createOfferAdvert({ payload, history }))
  dispatch(
    directMessagesQueueHandlers.epics.addDirectMessage({
      message,
      recipientAddress: payload.address,
      recipientUsername: payload.offerOwner
    })
  )
  dispatch(
    contactsHandlers.epics.updateDeletedChannelTimestamp({
      address: payload.id + payload.offerOwner,
      timestamp: 0
    })
  )
}

export const epics = {
  handleSend,
  handleSendTransfer
}

export default {
  epics
}
