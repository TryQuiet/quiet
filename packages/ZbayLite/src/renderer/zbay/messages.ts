import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import {
  messageType
} from '../../shared/static'

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
  publicKey: '',
  address: '',
  nickname: ''
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

export default {
  messageType
}
