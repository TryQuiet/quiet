import { DateTime } from 'luxon'
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import * as Yup from 'yup'
import secp256k1 from 'secp256k1'
import createKeccakHash from 'keccak'
import { packMemo, unpackMemo } from './transit'

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
    error: null
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

// fromYou check if publicKey from signature is yours

export const receivedToDisplayableMessage = ({
  message,
  identityAddress,
  receiver = { replyTo: '', username: 'Unnamed' }
}) => {
  return DisplayableMessage(message).merge({
    fromYou: true,
    receiver: ExchangeParticipant(receiver)
  })
}

export const vaultToDisplayableMessage = ({
  message,
  identityAddress,
  receiver = { replyTo: '', username: 'Unnamed' }
}) => {
  return DisplayableMessage(message).merge({
    fromYou: true,
    receiver: ExchangeParticipant(receiver)
  })
}

export const operationToDisplayableMessage = ({
  operation,
  identityAddress,
  receiver = { replyTo: '', username: 'Unnamed' }
}) =>
  DisplayableMessage(operation.meta.message).merge({
    error: operation.error,
    status: operation.status,
    id: operation.opId,
    fromYou: true,
    receiver: ExchangeParticipant(receiver)
  })

export const queuedToDisplayableMessage = ({
  messageKey,
  queuedMessage,
  identityAddress,
  receiver = { replyTo: '', username: 'Unnamed' }
}) =>
  DisplayableMessage(queuedMessage.message).merge({
    fromYou: true,
    id: messageKey,
    status: 'pending',
    receiver: ExchangeParticipant(receiver)
  })

export const messageSchema = Yup.object().shape({
  type: Yup.number()
    .oneOf(R.values(messageType))
    .required(),
  signature: Yup.Buffer,
  createdAt: Yup.number().required(),
  message: Yup.string()
})

export const transferToMessage = async props => {
  const { txid, amount, memo } = props
  let message = null
  try {
    message = await unpackMemo(memo)
  } catch (err) {
    console.warn(err)
    return null
  }
  try {
    return {
      ...(await messageSchema.validate(message)),
      id: txid,
      spent: new BigNumber(amount)
      // sender: {
      //   replyTo: 'INSERT',
      //   username: 'HERE'
      // }
      // Add sender here
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

export const signMessage = ({ messageData }) => {
  const privateKey = 'ceea41a1c9e91f839c96fba253b620da70992954b2a28b19322b191d8f5e56db' // import private key from vault
  const pKey = Buffer.alloc(32)
  pKey.write(privateKey, 0, 'hex')
  // sign the messageData
  const sigObj = secp256k1.sign(hash(messageData.data), pKey)

  return {
    type: messageData.type,
    signature: sigObj.signature,
    createdAt: DateTime.utc().toSeconds(),
    message: messageData.data
  }
}
export const getPublicKeysFromSignature = message => {
  return [
    secp256k1.recover(hash(message.message), message.signature, 0),
    secp256k1.recover(hash(message.message), message.signature, 1)
  ]
}
export const createMessage = ({ messageData }) => {
  return signMessage({ messageData })
}

export const createTransfer = values =>
  DisplayableMessage({
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
    message: values.memo,
    spent: values.amountZec,
    fromYou: true,
    status: 'broadcasted',
    error: null
  })

export const messageToTransfer = async ({
  message,
  channel,
  amount = '0.0001',
  recipientAddress
}) => {
  if ((recipientAddress || channel).length === 35) {
    return {
      from:
        'ztestsapling14dxhlp8ps4qmrslt7pcayv8yuyx78xpkrtfhdhae52rmucgqws2zp0zwf2zu6qxjp96lzapsn4r',
      amounts: [
        {
          address: recipientAddress || channel.address,
          amount: amount.toString()
        }
      ]
    }
  }
  const memo = await packMemo(message)
  return {
    from:
      'ztestsapling14dxhlp8ps4qmrslt7pcayv8yuyx78xpkrtfhdhae52rmucgqws2zp0zwf2zu6qxjp96lzapsn4r',
    amounts: [
      {
        address: recipientAddress || channel.address,
        amount: amount.toString(),
        memo
      }
    ]
  }
}

export const transfersToMessages = async (transfers, owner) => {
  const msgs = await Promise.all(transfers.map(t => transferToMessage(t)))

  return msgs.filter(x => x)
}

export const calculateDiff = ({ previousMessages, nextMessages, identityAddress, lastSeen }) =>
  nextMessages.filter(nextMessage => {
    const isNew = DateTime.fromSeconds(nextMessage.createdAt) > lastSeen
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
