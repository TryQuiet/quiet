import BigNumber from 'bignumber.js'
import crypto from 'crypto'
import * as R from 'ramda'

import { DisplayableMessage } from '../../zbay/messages'
import usersSelectors from '../selectors/users'
import identitySelectors from '../selectors/identity'
import channelSelectors from '../selectors/channel'
import contactsSelectors from '../selectors/contacts'
import { messages } from '../../zbay'
import client from '../../zcash'
import notificationsHandlers from './notifications'
import { errorNotification, successNotification } from './utils'
import contactsHandlers from './contacts'
import { messageType } from '../../../shared/static'
import operationsHandlers from './operations'
import history from '../../../shared/history'

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

const handleSendTransfer = ({ values, payload }) => async (
  dispatch,
  getState
) => {
  const myUser = usersSelectors.myUser(getState())
  const shippingData = identitySelectors.shippingData(getState())
  const privKey = identitySelectors.signerPrivKey(getState())
  const contacts = contactsSelectors.contacts(getState())
  const message = messages.createMessage({
    messageData: {
      type: messageType.ITEM_TRANSFER,
      data: {
        itemId: payload.id.substring(0, 64),
        tag: payload.tag,
        offerOwner: payload.offerOwner,
        shippingData: values.shippingInfo ? shippingData : null
      },
      spent: new BigNumber(values.zec)
    },
    privKey
  })
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
    offerOwner: payload.offerOwner,
    tag: payload.tag,
    shippingData: values.shippingInfo ? shippingData : null,
    message: {
      itemId: payload.id.substring(0, 64),
      offerOwner: payload.offerOwner,
      tag: payload.tag,
      shippingData: values.shippingInfo ? shippingData : null
    }
  })

  if (!contacts.get(payload.id + payload.offerOwner)) {
    await dispatch(
      contactsHandlers.actions.addContact({
        key: payload.id + payload.offerOwner,
        username: payload.tag + ' @' + payload.offerOwner,
        contactAddress: payload.address,
        offerId: payload.id
      })
    )
  }
  dispatch(
    contactsHandlers.actions.addMessage({
      key: payload.id + payload.offerOwner,
      message: { [key]: messagePlaceholder }
    })
  )
  history.push(
    `/main/offers/${payload.id + payload.offerOwner}/${payload.address}`
  )
  dispatch(
    operationsHandlers.actions.addOperation({
      channelId: payload.id + payload.offerOwner,
      id: key
    })
  )
  const identityAddress = identitySelectors.address(getState())
  const transfer = await messages.messageToTransfer({
    message: message,
    address: payload.address,
    identityAddress,
    amount: values.zec
  })
  const transaction = await client.sendTransaction(transfer)
  dispatch(
    operationsHandlers.epics.resolvePendingOperation({
      channelId: payload.id + payload.offerOwner,
      id: key,
      txid: transaction.txid
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
