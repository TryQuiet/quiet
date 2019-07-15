import Zcash from '../client'

const requestManager = {
  z_importviewingkey: jest.fn(async () => null),
  z_listreceivedbyaddress: jest.fn(async () => null),
  z_importkey: jest.fn(async () => null),
  z_exportkey: jest.fn(async (address) => `${address}-spending-key`),
  z_getbalance: jest.fn(async () => null),
  z_listunspent: jest.fn(async () => [0]),
  z_sendmany: jest.fn(async () => null),
  z_getoperationstatus: jest.fn(async () => []),
  z_getnewaddress: jest.fn(async (type) => `${type}-private-address`),
  getnewaddress: jest.fn(async () => 'transparent-address'),
  dumpprivkey: jest.fn(async (address) => `${address}-private-key`),
  importprivkey: jest.fn(async (address) => `${address}-private-key`)
}

const client = new Zcash({ requestManager: jest.fn(() => requestManager) })

export const mock = {
  requestManager,
  client
}

export const getClient = jest.fn(() => client)

export default {
  getClient
}
