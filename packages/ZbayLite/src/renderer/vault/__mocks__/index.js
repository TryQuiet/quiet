import Vault from './vault'
import testUtils from '../../testUtils/index'
export const getVault = jest.fn(() => new Vault())

export { mock } from './vault'

export default {
  create: jest.fn(() => Promise.resolve('create')),
  unlock: jest.fn(() => Promise.resolve('unlock')),
  exists: jest.fn(() => false),
  getVault,
  identity: {
    createIdentity: jest.fn(async () => {
      throw Error('createIdentity mock not implemented')
    }),
    listIdentities: jest.fn(async () => {
      throw Error('listIdentities mock not implemented')
    }),
    updateIdentitySignerKeys: jest.fn(async () => {
      throw Error('updateIdentitySignerKeys mock not implemented')
    }),
    updateShippingData: jest.fn(async () => null),
    updateDonation: jest.fn(async () => null),
    updateDonationAddress: jest.fn(async () => {
      return { identity: { donationAddress: 'test-address-donation' } }
    })
  },
  contacts: {
    updateLastSeen: jest.fn(async () => {}),
    getLastSeen: jest.fn(async () => {})
  },
  offers: {
    importOffer: jest.fn(async () => {}),
    saveMessage: jest.fn(async () => {}),
    listOffers: jest.fn(async () => {}),
    removeOffer: jest.fn(async () => {}),
    listMessages: jest.fn(async () => {
      return testUtils.vaultTestMessages
    }),
    updateLastSeen: jest.fn(async () => {})
  },
  transactionsTimestamps: {
    addTransaction: jest.fn(async () => {}),
    listTransactions: jest.fn(async () => {})
  }
}
