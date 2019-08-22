import { DateTime, Settings } from 'luxon'
import secp256k1 from 'secp256k1'
import BigNumber from 'bignumber.js'
import { messages as zbayMessages } from '../zbay'
import { hash } from '../zbay/messages'
Settings.defaultZoneName = 'utc'

const identities = [
  {
    address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya',
    username: 'Wenus'
  },
  {
    address: 'zs1dhqp9dtr4pksnmaynp2k22qduvywejg3neqq4swd4a6gnz6w0m208kefcdm9n2067yn5clcvgsq',
    username: 'Mars'
  }
]

const privateKey = 'ceea41a1c9e91f839c96fba253b620da70992954b2a28b19322b191d8f5e56db'
const pKey = Buffer.alloc(32)
pKey.write(privateKey, 0, 'hex')

export const now = DateTime.utc(2019, 3, 7, 13, 3, 48)

export const createChannel = id => ({
  id: id,
  name: `Channel ${id}`,
  private: Boolean(id % 2),
  address: `zs1testaddress${id}`,
  unread: id,
  description: id % 2 === 0 ? '' : `Channel about ${id}`,
  keys: {
    ivk: `incoming-viewing-key-${id}`
  }
})

export const channels = {
  createChannel
}

export const createVaultMessage = (
  id,
  createdAt = now.minus({ hours: id }).toSeconds(),
  replyTo = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya'
) => ({
  id,
  status: 'broadcasted',
  spent: new BigNumber('123'),
  type: zbayMessages.messageType.BASIC,
  createdAt,
  message: `This is some message ${id}`,
  sender: {
    replyTo,
    username: 'test'
  }
})

export const createMessage = (id, createdAt = now.minus({ hours: id }).toSeconds()) => ({
  id,
  type: zbayMessages.messageType.BASIC,
  createdAt,
  message: `This is some message ${id}`,
  signature: secp256k1.sign(hash(`This is a message with id ${id}`), pKey).signature
})

export const createReceivedMessage = ({
  id,
  createdAt = now.toSeconds(),
  sender = identities[0]
}) => ({
  id,
  spent: new BigNumber('0.32'),
  type: zbayMessages.messageType.BASIC,
  createdAt,
  message: `This is a message with id ${id}`,
  signature: secp256k1.sign(hash(`This is a message with id ${id}`), pKey).signature
})

export const createSendableMessage = ({
  message,
  createdAt = now.toSeconds(),
  type = zbayMessages.messageType.BASIC
}) => ({
  type,
  signature: secp256k1.sign(hash(message), pKey).signature,
  createdAt,
  message
})

export const createSendableTransferMessage = ({
  message = 'hello',
  createdAt = now.toSeconds()
}) => ({
  type: zbayMessages.messageType.TRANSFER,
  spent: new BigNumber('0.32'),
  sender: {
    replyTo: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya',
    username: 'Wenus'
  },
  receiver: {
    replyTo: 'zs1z9rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya',
    username: 'Sun'
  },
  createdAt,
  signature: secp256k1.sign(hash(message), pKey).signature,
  message
})

export const createReceivedTransferMessage = ({ id, createdAt = now.toSeconds() }) => ({
  id,
  spent: new BigNumber('0.32'),
  type: zbayMessages.messageType.TRANSFER,
  createdAt,
  message: `This is a message with id ${id}`,
  signature: secp256k1.sign(hash(`This is a message with id ${id}`), pKey).signature
})

export const messages = {
  createReceivedMessage,
  createSendableMessage,
  createReceivedTransferMessage,
  createSendableTransferMessage,
  createMessage,
  createVaultMessage
}

export const createTransfer = ({ txid, amount = '0.0001', memo = '', change = false }) => ({
  txid,
  amount,
  memo,
  change
})

export const transfers = {
  createTransfer
}

export const createIdentity = ({
  name = 'Saturn',
  address = 'saturn-private-address',
  transparentAddress = 'saturn-transparent-address',
  keys = {
    tpk: 'saturn-tpk',
    sk: 'saturn-sk'
  }
} = {}) => ({
  name,
  address,
  transparentAddress,
  keys
})

export default {
  identities,
  now,
  transfers,
  channels,
  messages,
  createIdentity,
  createMessage,
  createSendableTransferMessage
}
