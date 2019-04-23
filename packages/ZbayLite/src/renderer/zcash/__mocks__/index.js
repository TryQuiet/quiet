import Zcash from '../client'

const requestManager = {
  z_importviewingkey: async () => null
}

export const mock = {
  requestManager
}

export const getClient = jest.fn(() => new Zcash({ requestManager: jest.fn(() => requestManager) }))

export default {
  getClient
}
