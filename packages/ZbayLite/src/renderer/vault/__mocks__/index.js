import Vault from './vault'

export const getVault = jest.fn(() => new Vault())

export { mock } from './vault'

export default {
  create: jest.fn(() => Promise.resolve('create')),
  unlock: jest.fn(() => Promise.resolve('unlock')),
  exists: jest.fn(() => false),
  getVault,
  identity: {
    createIdentity: jest.fn(async () => { throw Error('createIdentity mock not implemented') }),
    listIdentities: jest.fn(async () => { throw Error('listIdentities mock not implemented') })
  }
}
