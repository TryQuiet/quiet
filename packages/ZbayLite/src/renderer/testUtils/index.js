import { DateTime, Settings } from 'luxon'
import secp256k1 from 'secp256k1'
import BigNumber from 'bignumber.js'
import { hash } from '../zbay/messages'
import defaultChannels from '../zcash/channels'
import { messageType } from '../../shared/static'
Settings.defaultZoneName = 'utc'

export const vaultTestMessages = [
  {
    id: '123',
    properties: {
      title: 'test',
      createdAt: '123456',
      message: `{"itemId":"6b31f1a5c68902a767eb542fa17daeb338e32d12704ac124ce55994754a5001e","text":"hello"}`,
      sender: 'testsender',
      senderUsername: 'testusername',
      type: '11',
      id: '049a7d2ab30817765ea9875bfca40299669e1631329fc58b2a053ff58f78b007'
    }
  },
  {
    id: '1234',
    properties: {
      title: 'test2',
      createdAt: '123456',
      message: `{"itemId":"6b31f1a5c68902a767eb542fa17daeb338e32d12704ac124ce55994754a5001e","text":"hello"}`,
      sender: 'testsender',
      senderUsername: 'testusername',
      type: '11',
      id: '149a7d2ab30817765ea9875bfca40299669e1631329fc58b2a053ff58f78b007'
    }
  }
]
export const identities = [
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
  advertFee: 0.15,
  keys: {
    ivk: `incoming-viewing-key-${id}`,
    sk: 'test-secret-key'
  }
})

export const createUsersChannel = (id, network = 'testnet') => {
  return {
    id: id,
    name: `Channel ${id}`,
    private: Boolean(id % 2),
    address: defaultChannels.registeredUsers[network].address,
    unread: id,
    description: id % 2 === 0 ? '' : `Channel about ${id}`,
    keys: {
      ivk: `incoming-viewing-key-${id}`
    }
  }
}

export const channels = {
  createChannel,
  createUsersChannel
}

export const createVaultMessage = (
  id,
  createdAt = now.minus({ hours: id }).toSeconds(),
  replyTo = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya'
) => ({
  id,
  status: 'broadcasted',
  spent: new BigNumber('123'),
  type: messageType.BASIC,
  createdAt,
  message: `This is some message ${id}`,
  sender: {
    replyTo,
    username: 'test'
  }
})

export const createMessage = (id, createdAt = now.minus({ hours: id }).toSeconds()) => ({
  id,
  type: messageType.BASIC,
  createdAt,
  message: `This is some message ${id}`,
  signature: secp256k1.sign(hash(`This is a message with id ${id}`), pKey).signature
})
export const createItemMessage = (id, createdAt = now.minus({ hours: id }).toSeconds()) => ({
  id,
  type: messageType.BASIC,
  createdAt,
  message: { itemId: 'test1', test: `This is some message ${id}` },
  signature: secp256k1.sign(hash(`This is a message with id ${id}`), pKey).signature
})

export const createReceivedMessage = ({
  id,
  createdAt = now.toSeconds(),
  sender = identities[0]
}) => ({
  id,
  spent: new BigNumber('0.32'),
  type: messageType.BASIC,
  createdAt,
  message: `This is a message with id ${id}`,
  signature: secp256k1.sign(hash(`This is a message with id ${id}`), pKey).signature
})

export const createSendableMessage = ({
  message,
  createdAt = now.toSeconds(),
  type = messageType.BASIC
}) => ({
  type,
  signature: secp256k1.sign(hash(message), pKey).signature,
  createdAt,
  message
})

export const createSendableUserMessage = ({
  message,
  createdAt = now.toSeconds(),
  type = messageType.USER
}) => ({
  type,
  signature: secp256k1.sign(hash(JSON.stringify(message) + createdAt), pKey).signature,
  createdAt,
  message
})

export const createSendableTransferMessage = ({
  message = 'hello',
  createdAt = now.toSeconds()
}) => ({
  type: messageType.TRANSFER,
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
  type: messageType.TRANSFER,
  createdAt,
  message: `This is a message with id ${id}`,
  signature: secp256k1.sign(hash(`This is a message with id ${id}`), pKey).signature
})

export const createReceivedUserMessage = ({ id, createdAt = now.toSeconds() }) => ({
  id,
  spent: new BigNumber('0.32'),
  type: messageType.USER,
  createdAt,
  message: {
    firstName: 'testname',
    lastName: 'testlastname',
    nickname: 'nickname',
    address:
      'ztestsapling14dxhlp8ps4qmrslt7pcayv8yuyx78xpkrtfhdhae52rmucgqws2zp0zwf2zu6qxjp96lzapsn4r'
  },
  signature: secp256k1.sign(
    hash(
      JSON.stringify({
        firstName: 'testname',
        lastName: 'testlastname',
        nickname: 'nickname',
        address:
          'ztestsapling14dxhlp8ps4qmrslt7pcayv8yuyx78xpkrtfhdhae52rmucgqws2zp0zwf2zu6qxjp96lzapsn4r'
      }) + id
    ),
    pKey
  ).signature,
  r: secp256k1.sign(
    hash(
      JSON.stringify({
        firstName: 'testname',
        lastName: 'testlastname',
        nickname: 'nickname',
        address:
          'ztestsapling14dxhlp8ps4qmrslt7pcayv8yuyx78xpkrtfhdhae52rmucgqws2zp0zwf2zu6qxjp96lzapsn4r'
      }) + id
    ),
    pKey
  ).recovery
})

export const messages = {
  createReceivedMessage,
  createSendableMessage,
  createReceivedTransferMessage,
  createSendableTransferMessage,
  createMessage,
  createVaultMessage,
  createReceivedUserMessage,
  createSendableUserMessage
}

export const createTransfer = ({ txid, amount = '0', memo = '', change = false }) => ({
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
  signerPrivKey = 'AyrXTov+4FEyle1BrxndDhePlUOB1nPV5YvyexC8m6E=',
  signerPubKey = 'Alw9G29ahXm5et9T7FJF3lbXVXNkapR826yPtfMVJYnK',
  keys = {
    tpk: 'saturn-tpk',
    sk: 'saturn-sk'
  },
  shippingData = {
    firstName: 'Saturn',
    lastName: 'the Planet',
    street: 'Coders Dv',
    country: 'Poland',
    region: 'Malopolska',
    city: 'Krakow',
    postalCode: '1337-455'
  }
} = {}) => ({
  name,
  address,
  transparentAddress,
  signerPrivKey,
  signerPubKey,
  shippingData,
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
  createSendableTransferMessage,
  createItemMessage,
  createReceivedMessage,
  vaultTestMessages
}
