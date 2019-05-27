import Zcash from '../client'

const requestManager = {
  z_importviewingkey: jest.fn(async () => null),
  z_listreceivedbyaddress: jest.fn(async () => null),
  z_importkey: jest.fn(async () => null),
  z_exportkey: jest.fn(async () => null),
  z_getbalance: jest.fn(async () => null),
  z_sendmany: jest.fn(async () => null),
  z_getoperationstatus: jest.fn(async () => null),
  z_getnewaddress: jest.fn(async () => null)
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
