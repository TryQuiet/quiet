import { DateTime, Settings } from 'luxon'
import { DisplayableMessage } from '@zbayapp/nectar/lib/sagas/publicChannels/publicChannels.types'

Settings.defaultZoneName = 'utc'

export const now = DateTime.utc(2019, 3, 7, 13, 3, 48)

export const createChannel = () => ({})

export const channels = {
  createChannel
}

export const createMessage = (): DisplayableMessage => {
  return {
    id: '1',
    type: 1,
    message: 'example message',
    createdAt: 'Today',
    nickname: 'Edd'
  }
}

export const messages = {
  createMessage
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
  now,
  channels,
  messages,
  createIdentity,
  createMessage
}
