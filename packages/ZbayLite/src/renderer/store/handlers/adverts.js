import BigNumber from 'bignumber.js'
import crypto from 'crypto'
import * as R from 'ramda'

import { DisplayableMessage } from '../../zbay/messages'
import usersSelectors from '../selectors/users'
import identitySelectors from '../selectors/identity'
import channelSelectors from '../selectors/channel'
import offersHandlers from '../../store/handlers/offers'
import { messages } from '../../zbay'
import client from '../../zcash'
import notificationsHandlers from './notifications'
import directMessagesQueueHandlers from './directMessagesQueue'
import { errorNotification, successNotification } from './utils'
import contactsHandlers from './contacts'
import { messageType } from '../../../shared/static'
import operationsHandlers from './operations'

const handleSend = ({ values }) => async (dispatch, getState) => {
  const data = {
    tag: values.tag,
    background: values.background.toString(),
    title: values.title,
    provideShipping: values.shippingInfo ? '1' : '0',
    amount: values.usd.toString(),
    description: values.description
  }
  const identityAddress = identitySelectors.address(getState())
  const channel = channelSelectors.channel(getState())
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = messages.createMessage({
    messageData: {
      type: messageType.AD,
      data: data,
      spent: 0 // channel ? channel.advertFee.toString() : '0' TODO support fee change
    },
    privKey
  })
  const transfer = await messages.messageToTransfer({
    message,
    address: channel.address,
    identityAddress
  })
  const myUser = usersSelectors.myUser(getState())
  const messageDigest = crypto.createHash('sha256')

  const messageEssentials = R.pick(['createdAt', 'message', 'spent'])(message)
  const key = messageDigest
    .update(JSON.stringify(messageEssentials))
    .digest('hex')

  const messagePlaceholder = DisplayableMessage({
    ...message,
    id: key,
    sender: {
      replyTo: myUser.address,
      username: myUser.nickname
    },
    fromYou: true,
    status: 'pending',
    message: message.message
  })
  dispatch(
    contactsHandlers.actions.addMessage({
      key: channel.id,
      message: { [key]: messagePlaceholder }
    })
  )
  dispatch(
    operationsHandlers.actions.addOperation({
      channelId: channel.id,
      id: key
    })
  )
  try {
    const transaction = await client.sendTransaction(transfer)
    dispatch(
      operationsHandlers.epics.resolvePendingOperation({
        channelId: channel.id,
        id: key,
        txid: transaction.txid
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
        shippingData: payload.provideShipping ? shippingData : null
      },
      spent: new BigNumber(values.zec)
    },
    privKey
  })
  dispatch(offersHandlers.epics.createOfferAdvert({ payload, history }))
  dispatch(
    directMessagesQueueHandlers.epics.addDirectMessage(
      {
        message,
        recipientAddress: payload.address,
        recipientUsername: payload.offerOwner
      },
      0,
      false
    )
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
