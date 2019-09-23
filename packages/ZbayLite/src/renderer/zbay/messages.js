import { DateTime } from 'luxon'
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import * as Yup from 'yup'
import secp256k1 from 'secp256k1'
import createKeccakHash from 'keccak'
import { packMemo, unpackMemo } from './transit'
import { getClient } from '../zcash'
export const messageType = {
  BASIC: 1,
  AD: 2,
  TRANSFER: 4,
  USER: 5
}

export const ExchangeParticipant = Immutable.Record(
  {
    replyTo: '',
    username: 'Unnamed'
  },
  'ExchangeParticipant'
)

export const _DisplayableMessage = Immutable.Record(
  {
    id: null,
    type: messageType.BASIC,
    sender: ExchangeParticipant(),
    receiver: ExchangeParticipant(),
    createdAt: null,
    message: '',
    spent: new BigNumber(0),
    fromYou: false,
    status: 'broadcasted',
    error: null,
    isUnregistered: false
  },
  'DisplayableMessage'
)

export const DisplayableMessage = values => {
  const record = _DisplayableMessage(values)
  return record.merge({
    sender: ExchangeParticipant(record.sender),
    receiver: ExchangeParticipant(record.receiver)
  })
}

const _isOwner = (identityAddress, message) => message.sender.replyTo === identityAddress

export const receivedToDisplayableMessage = ({
  message,
  identityAddress,
  receiver = { replyTo: '', username: 'Unnamed' }
}) => {
  return DisplayableMessage(message).merge({
    fromYou: _isOwner(identityAddress, message),
    receiver: ExchangeParticipant(receiver)
  })
}

export const vaultToDisplayableMessage = ({
  message,
  identityAddress,
  receiver = { replyTo: '', username: 'Unnamed' }
}) => {
  return DisplayableMessage(message).merge({
    fromYou: _isOwner(identityAddress, message),
    receiver: ExchangeParticipant(receiver)
  })
}

export const operationToDisplayableMessage = ({
  operation,
  identityAddress,
  identityName,
  receiver = { replyTo: '', username: 'Unnamed' }
}) => {
  return DisplayableMessage(operation.meta.message).merge({
    error: operation.error,
    status: operation.status,
    id: operation.opId,
    sender: ExchangeParticipant({ replyTo: identityAddress, username: identityName }),
    fromYou: true,
    receiver: ExchangeParticipant(receiver)
  })
}

export const queuedToDisplayableMessage = ({
  messageKey,
  queuedMessage,
  identityAddress,
  identityName,
  receiver = { replyTo: '', username: 'Unnamed' }
}) =>
  DisplayableMessage(queuedMessage.message).merge({
    fromYou: true,
    id: messageKey,
    status: 'pending',
    sender: ExchangeParticipant({ replyTo: identityAddress, username: identityName }),
    receiver: ExchangeParticipant(receiver)
  })

Yup.addMethod(Yup.mixed, 'validateMessage', function (params) {
  return this.test('test', null, async function (value) {
    if (value === null) {
      return true
    }
    if (typeof value === 'string') {
      return true
    }
    if (typeof value === 'object') {
      try {
        await _validateMessage.validate(value)
        return true
      } catch (err) {
        return false
      }
    }
    return false
  })
})
const _validateMessage = Yup.object().shape({
  firstName: Yup.string(),
  lastName: Yup.string(),
  nickname: Yup.string(),
  address: Yup.string()
})
export const messageSchema = Yup.object().shape({
  type: Yup.number()
    .oneOf(R.values(messageType))
    .required(),
  signature: Yup.Buffer,
  r: Yup.number().required(),
  createdAt: Yup.number().required(),
  message: Yup.mixed().validateMessage()
})

export const usernameSchema = Yup.object().shape({
  nickname: Yup.string()
    .min(3)
    .max(20)
    .matches(/^[a-z0-9]+$/)
})

export const transferToMessage = async (props, users) => {
  const { txid, amount, memo } = props
  let message = null
  let sender = { replyTo: '', username: 'Unnamed' }
  let isUnregistered = false
  try {
    message = await unpackMemo(memo)
    const publicKey = getPublicKeysFromSignature(message).toString('hex')
    if (users !== undefined) {
      const fromUser = users.get(publicKey)
      if (fromUser !== undefined) {
        const isUsernameValid = usernameSchema.isValidSync(fromUser)
        sender = ExchangeParticipant({ replyTo: fromUser.address, username: isUsernameValid ? fromUser.nickname : `anon${publicKey.substring(0, 15)}` })
      } else {
        sender = ExchangeParticipant({
          replyTo: '',
          username: `anon${publicKey}`
        })
        isUnregistered = true
      }
    }
  } catch (err) {
    console.warn(err)
    return null
  }
  try {
    return {
      ...(await messageSchema.validate(message)),
      id: txid,
      spent: new BigNumber(amount),
      sender: sender,
      isUnregistered
    }
  } catch (err) {
    console.warn('Incorrect message format: ', err)
    return null
  }
}

export const hash = data => {
  return createKeccakHash('keccak256')
    .update(data)
    .digest()
}

export const signMessage = ({ messageData, privKey }) => {
  // sign the messageData
  const sigObj = secp256k1.sign(hash(JSON.stringify(messageData.data)), Buffer.from(privKey, 'hex'))
  return {
    type: messageData.type,
    spent: messageData.spent,
    signature: sigObj.signature,
    r: sigObj.recovery,
    createdAt: DateTime.utc().toSeconds(),
    message: messageData.data
  }
}
export const getPublicKeysFromSignature = message => {
  return secp256k1.recover(hash(JSON.stringify(message.message)), message.signature, message.r)
}
export const createMessage = ({ messageData, privKey }) => {
  return signMessage({ messageData, privKey })
}

export const createTransfer = values => {
  let memo = values.memo
  if (values.shippingInfo) {
    memo += `\n\n Shipping information : \n${values.shippingData.firstName} ${
      values.shippingData.lastName
    }\n${values.shippingData.country} ${values.shippingData.region} \n ${
      values.shippingData.city
    } ${values.shippingData.street} ${values.shippingData.postalCode}`
  }
  return DisplayableMessage({
    type: messageType.TRANSFER,
    sender: {
      replyTo: values.sender.address,
      username: values.sender.name
    },
    receiver: {
      replyTo: values.recipient,
      username: ''
    },
    createdAt: DateTime.utc().toSeconds(),
    message: memo,
    spent: values.amountZec,
    fromYou: true,
    status: 'broadcasted',
    error: null
  })
}

const _splitUtxo = ({ transfer, utxos, splitTreshhold, fee, identityAddress }) => {
  const utxo = utxos.find(
    utxo => utxo.amount > parseFloat(transfer.amount.toString()) + 2 * splitTreshhold + fee
  )
  if (utxo) {
    const newUtxo = {
      address: identityAddress,
      amount: parseFloat((utxo.amount - parseFloat(transfer.amount.toString()) - fee) / 2).toFixed(
        4
      )
    }
    return [transfer, newUtxo]
  } else {
    return [transfer]
  }
}
export const messageToTransfer = async ({
  message,
  amount = '0.0001',
  address,
  identityAddress,
  splitTreshhold = 0.005,
  fee = 0.0001
}) => {
  const utxos = await getClient().payment.unspentNotes({ addresses: [identityAddress] })
  let transfer
  let memo
  if (address.length === 35) {
    transfer = {
      address: address,
      amount: amount.toString()
    }
  } else {
    memo = await packMemo(message)
    transfer = {
      address: address,
      amount: amount.toString(),
      memo
    }
  }
  return {
    from: identityAddress,
    amounts:
      identityAddress === address
        ? [transfer]
        : _splitUtxo({ transfer, utxos, splitTreshhold, fee, identityAddress })
  }
}
export const transfersToMessages = async (transfers, owner) => {
  const msgs = await Promise.all(transfers.map(t => transferToMessage(t)))

  return msgs.filter(x => x)
}

export const calculateDiff = ({ previousMessages, nextMessages, identityAddress, lastSeen }) =>
  nextMessages.filter(nextMessage => {
    const isNew = DateTime.fromSeconds(nextMessage.createdAt) > lastSeen || lastSeen === null
    const notOwner = identityAddress !== nextMessage.sender.replyTo
    return isNew && notOwner && !previousMessages.includes(nextMessage)
  })

export default {
  receivedToDisplayableMessage,
  queuedToDisplayableMessage,
  operationToDisplayableMessage,
  calculateDiff,
  createMessage,
  messageType,
  messageToTransfer,
  transferToMessage,
  transfersToMessages,
  vaultToDisplayableMessage
}
