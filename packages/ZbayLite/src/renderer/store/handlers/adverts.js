import BigNumber from 'bignumber.js'

import identitySelectors from '../selectors/identity'
import channelSelectors from '../selectors/channel'
import offersHandlers from '../../store/handlers/offers'
import { messageType } from '../../zbay/messages'
import { messages } from '../../zbay'
import { getClient } from '../../zcash'
import notificationsHandlers from './notifications'
import directMessagesQueueHandlers from './directMessagesQueue'
import { errorNotification, successNotification } from './utils'
import operationsHandlers, { operationTypes } from './operations'
import contactsHandlers from './contacts'

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
  const channel = channelSelectors.data(getState()).toJS()
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = messages.createMessage({
    messageData: {
      type: messageType.AD,
      data: data,
      spent: new BigNumber('0.0001')
    },
    privKey
  })
  const transfer = await messages.messageToTransfer({
    message,
    address: channel.address,
    identityAddress
  })
  try {
    const opId = await getClient().payment.send(transfer)
    await dispatch(
      operationsHandlers.epics.observeOperation({
        opId,
        type: operationTypes.pendingMessage,
        meta: {
          channelId: channel.id,
          message: message
        }
      })
    )
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification('Advert successfully posted')
      )
    )
  } catch (err) {
    notificationsHandlers.actions.enqueueSnackbar(
      dispatch(
        errorNotification({
          message: "Couldn't send the message, please check node connection."
        })
      )
    )
  }
}

const handleSendTransfer = ({ values, history, payload }) => async (dispatch, getState) => {
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
  dispatch(directMessagesQueueHandlers.epics.addDirectMessage({
    message,
    recipientAddress: payload.address,
    recipientUsername: payload.offerOwner
  })
  )
  dispatch(contactsHandlers.epics.updateDeletedChannelTimestamp({ address: payload.id + payload.offerOwner, timestamp: 0 }))
}

export const epics = {
  handleSend,
  handleSendTransfer
}

export default {
  epics
}
