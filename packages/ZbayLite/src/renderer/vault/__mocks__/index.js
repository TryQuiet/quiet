// TODO: do usuniecia?
export default {
  create: jest.fn(() => Promise.resolve('create')),
  unlock: jest.fn(() => Promise.resolve('unlock')),
  exists: jest.fn(() => false),
  identity: {
    createIdentity: jest.fn(async () => { throw Error('createIdentity mock not implemented') }),
    listIdentities: jest.fn(async () => { throw Error('listIdentities mock not implemented') })
  }
}
