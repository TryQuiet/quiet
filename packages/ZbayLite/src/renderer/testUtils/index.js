import { DateTime, Settings } from 'luxon'
import BigNumber from 'bignumber.js'

import { messages as zbayMessages } from '../zbay'

Settings.defaultZoneName = 'utc'

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

export const createMessage = (
  id,
  createdAt = now.minus({ hours: id }).toSeconds(),
  replyTo = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya'
) => ({
  id,
  type: zbayMessages.messageType.BASIC,
  createdAt,
  message: `This is some message ${id}`,
  sender: {
    replyTo
  }
})

export const createReceivedMessage = ({
  id,
  createdAt = now.toSeconds()
}) => ({
  id,
  spent: new BigNumber('0.32'),
  type: zbayMessages.messageType.BASIC,
  createdAt,
  message: `This is a message with id ${id}`,
  sender: {
    replyTo: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya',
    username: 'Wenus'
  }
})

export const createSendableMessage = ({
  message,
  createdAt = now.toSeconds()
}) => ({
  type: zbayMessages.messageType.BASIC,
  sender: {
    replyTo: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya',
    username: 'Wenus'
  },
  createdAt,
  message
})

export const messages = {
  createReceivedMessage,
  createSendableMessage,
  createMessage
}

export const createTransfer = ({
  txid,
  amount = '0.0001',
  memo = '',
  change = false
}) => ({
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
  now,
  transfers,
  channels,
  messages,
  createIdentity
}
