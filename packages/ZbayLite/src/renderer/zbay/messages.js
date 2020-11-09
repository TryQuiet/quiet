import { DateTime } from 'luxon'
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import * as Yup from 'yup'
import secp256k1 from 'secp256k1'
import createKeccakHash from 'keccak'
import { packMemo, unpackMemo } from './transit'
import {
  networkFee,
  targetUtxoCount,
  messageType,
  satoshiMultiplier
} from '../../shared/static'
import client from '../zcash'

export const ExchangeParticipant = Immutable.Record(
  {
    replyTo: '',
    username: 'Unnamed',
    publicKey: ''
  },
  'ExchangeParticipant'
)

export const exchangeParticipant = {
  replyTo: '',
  username: 'Unnamed',
  publicKey: ''
}

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
    shippingData: null,
    tag: '',
    offerOwner: null,
    isUnregistered: false,
    publicKey: null,
    blockHeight: Number.MAX_SAFE_INTEGER
  },
  'DisplayableMessage'
)

export const _displayableMessage = {
  id: null,
  type: messageType.BASIC,
  sender: { ...exchangeParticipant },
  receiver: { ...exchangeParticipant },
  createdAt: null,
  message: '',
  spent: new BigNumber(0),
  fromYou: false,
  status: 'broadcasted',
  error: null,
  shippingData: null,
  tag: '',
  offerOwner: null,
  isUnregistered: false,
  publicKey: null,
  blockHeight: Number.MAX_SAFE_INTEGER
}

export const DisplayableMessage = (values) => {
  if (values) {
    const record = {
      ..._displayableMessage,
      ...values
    }
    return record
  }
  return {
    ..._displayableMessage
  }
}

const _isOwner = (identityAddress, message) =>
  message.sender.replyTo === identityAddress

export const receivedToDisplayableMessage = ({
  message,
  identityAddress,
  receiver = { replyTo: '', username: 'Unnamed' }
}) => {
  const record = {
    ..._displayableMessage,
    fromYou: _isOwner(identityAddress, message),
    receiver: {
      ...exchangeParticipant,
      ...receiver
    }
  }
  return record
}

export const vaultToDisplayableMessage = ({
  message,
  identityAddress,
  receiver = { replyTo: '', username: 'Unnamed' }
}) => {
  const record = {
    ..._displayableMessage,
    fromYou: _isOwner(identityAddress, message),
    receiver: {
      ...exchangeParticipant,
      ...receiver
    }
  }
  return record
}

export const operationToDisplayableMessage = ({
  operation,
  tag,
  offerOwner,
  identityAddress,
  identityName,
  receiver = { replyTo: '', username: 'Unnamed' }
}) => {
  const record = {
    ...operation.meta.message,
    tag,
    offerOwner,
    error: operation.error,
    status: operation.status,
    id: operation.opId,
    sender: {
      ...exchangeParticipant,
      replyTo: identityAddress,
      username: identityName
    },
    fromYou: true,
    receiver: {
      ...exchangeParticipant,
      ...receiver
    }
  }
  return record
}

export const queuedToDisplayableMessage = ({
  messageKey,
  tag,
  offerOwner,
  queuedMessage,
  identityAddress,
  identityName,
  receiver = { replyTo: '', username: 'Unnamed' }
}) => {
  const record = {
    ...queuedMessage.message,
    tag,
    offerOwner,
    fromYou: true,
    id: messageKey,
    status: 'pending',
    sender: {
      ...exchangeParticipant,
      replyTo: identityAddress,
      username: identityName
    },
    receiver: {
      ...exchangeParticipant,
      ...receiver
    }
  }
  return record
}

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
  type: Yup.number().oneOf(R.values(messageType)).required(),
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
  const { txid, amount, memohex, block_height: blockHeight } = props
  let message = null
  let sender = { replyTo: '', username: 'Unnamed' }
  let isUnregistered = false
  let publicKey = null
  try {
    message = await unpackMemo(memohex)
    const { type } = message
    if (type === 'UNKNOWN') {
      return {
        type: 'UNKNOWN',
        payload: message,
        id: txid,
        spent: amount,
        blockHeight
      }
    }
    publicKey = getPublicKeysFromSignature(message).toString('hex')
    if (users !== undefined) {
      const fromUser = users[publicKey]
      if (fromUser !== undefined) {
        const isUsernameValid = usernameSchema.isValidSync(fromUser)
        sender = {
          ...exchangeParticipant,
          replyTo: fromUser.address,
          username: isUsernameValid
            ? fromUser.nickname
            : `anon${publicKey.substring(0, 10)}`
        }
      } else {
        sender = {
          ...exchangeParticipant,
          replyTo: '',
          username: `anon${publicKey}`
        }
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
      isUnregistered,
      publicKey,
      blockHeight
    }
  } catch (err) {
    console.warn('Incorrect message format: ', err)
    return null
  }
}
export const outgoingTransferToMessage = async (props, users) => {
  const { txid } = props
  let message = null
  let sender = { replyTo: '', username: 'Unnamed' }
  let isUnregistered = false
  let publicKey = null
  const transactionData = props.outgoing_metadata[0]
  const { block_height: blockHeight } = props
  try {
    message = await unpackMemo(
      transactionData.memo
        ? transactionData.memo.substring(2)
        : transactionData.memohex
    )
    const { type } = message
    if (type === 'UNKNOWN') {
      return {
        type: 'UNKNOWN',
        payload: message,
        id: txid,
        spent: transactionData.value / satoshiMultiplier,
        blockHeight
      }
    }
    publicKey = getPublicKeysFromSignature(message).toString('hex')
    if (users !== undefined) {
      const fromUser = users[publicKey]
      if (fromUser !== undefined) {
        const isUsernameValid = usernameSchema.isValidSync(fromUser)
        sender = {
          ...exchangeParticipant,
          replyTo: fromUser.address,
          username: isUsernameValid
            ? fromUser.nickname
            : `anon${publicKey.substring(0, 10)}`
        }
      } else {
        sender = {
          ...exchangeParticipant,
          replyTo: '',
          username: `anon${publicKey}`
        }
        isUnregistered = true
      }
    }
  } catch (err) {
    console.warn(err)
    return null
  }
  try {
    const toUser = Array.from(Object.values(users)).find(
      (u) => u.address === transactionData.address
    ) || {
      ...exchangeParticipant
    }
    return {
      ...(await messageSchema.validate(message)),
      id: txid,
      receiver: {
        replyTo: toUser.address,
        publicKey: toUser.publicKey,
        username: toUser.nickname
      },
      spent: new BigNumber(transactionData.value / satoshiMultiplier),
      sender: sender,
      fromYou: true,
      isUnregistered,
      publicKey,
      blockHeight,
      offerOwner: message.message.offerOwner,
      tag: message.message.tag,
      shippingData: message.message.shippingData
    }
  } catch (err) {
    console.warn('Incorrect message format: ', err)
    return null
  }
}

export const hash = (data) => {
  return createKeccakHash('keccak256').update(data).digest()
}

export const signMessage = ({ messageData, privKey }) => {
  // sign the messageData
  const sigObj = secp256k1.sign(
    hash(JSON.stringify(messageData.data)),
    Buffer.from(privKey, 'hex')
  )
  return {
    type: messageData.type,
    spent: messageData.spent || new BigNumber(0),
    signature: sigObj.signature,
    r: sigObj.recovery,
    createdAt: parseInt(DateTime.utc().toSeconds()),
    message: messageData.data
  }
}
export const getPublicKeysFromSignature = (message) => {
  return secp256k1.recover(
    hash(JSON.stringify(message.message)),
    message.signature,
    message.r
  )
}
export const createMessage = ({ messageData, privKey }) => {
  return signMessage({ messageData, privKey })
}

export const createTransfer = (values) => {
  let memo = values.memo
  if (values.shippingInfo) {
    memo += `\n\n Ship to: \n${values.shippingData.firstName} ${values.shippingData.lastName}\n${values.shippingData.country} ${values.shippingData.region} \n ${values.shippingData.city} ${values.shippingData.street} ${values.shippingData.postalCode}`
  }
  return {
    type: messageType.TRANSFER,
    sender: values.sender,
    receiver: values.receiver,
    createdAt: DateTime.utc().toSeconds(),
    memo: memo || '',
    spent: values.amountZec
  }
}

export const _buildUtxo = ({
  transfer,
  utxos,
  splitTreshhold,
  fee,
  identityAddress
}) => {
  let transfers = [transfer]
  let includedDonation = 0

  if (
    utxos.unspent_notes.filter(
      (utxo) =>
        utxo.value / satoshiMultiplier >= networkFee && utxo.spendable === true
    ).length <= targetUtxoCount
  ) {
    const utxo = utxos.unspent_notes.find(
      (utxo) =>
        utxo.value / satoshiMultiplier >
        parseFloat(transfer.amount) +
          2 * splitTreshhold +
          fee +
          includedDonation
    )
    // const standardMemo = addStandardToMemo('internal utxo creation')
    if (utxo) {
      const newUtxo = {
        address: identityAddress,
        amount: splitTreshhold * satoshiMultiplier
        // memo: standardMemo
      }
      transfers.push(newUtxo)
    }
  }
  return transfers
}

export const trimMemo = (a) => {
  return a.replace(/0+$/g, '')
}
export const messageToTransfer = async ({
  message,
  amount = 0,
  address,
  identityAddress = false,
  splitTreshhold = networkFee * 20,
  fee = networkFee,
  donation = { allow: false }
}) => {
  let transfer
  let memo
  if (address.length === 35) {
    transfer = {
      address: address,
      amount: new BigNumber(amount).times(satoshiMultiplier).toNumber()
    }
  } else {
    memo = await packMemo(message)
    transfer = {
      address: address,
      amount: new BigNumber(amount).times(satoshiMultiplier).toNumber(),
      memo: `0x${trimMemo(memo)}`
    }
  }
  const utxos = await client.notes()

  return identityAddress
    ? _buildUtxo({ transfer, utxos, fee, identityAddress, splitTreshhold })
    : transfer
}
export const createEmptyTransfer = ({ address, amount = 0, memo = '' }) => {
  return {
    address: address,
    amount: new BigNumber(amount).times(satoshiMultiplier).toNumber(),
    memo: memo
  }
}
export const transfersToMessages = async (transfers, owner) => {
  const msgs = await Promise.all(transfers.map((t) => transferToMessage(t)))

  return msgs.filter((x) => x)
}

export const calculateDiff = ({
  previousMessages,
  nextMessages,
  identityAddress,
  lastSeen
}) => {
  return nextMessages.filter((nextMessage) => {
    const isNew =
      DateTime.fromSeconds(nextMessage.createdAt) > lastSeen ||
      lastSeen === null ||
      lastSeen === undefined
    const notOwner = identityAddress !== nextMessage.sender.replyTo
    return isNew && notOwner && !previousMessages.includes(nextMessage)
  })
}

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
  vaultToDisplayableMessage,
  createEmptyTransfer,
  outgoingTransferToMessage
}
