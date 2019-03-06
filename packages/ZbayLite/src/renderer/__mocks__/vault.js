export default () => ({
  create: jest.fn(async () => null),
  unlock: jest.fn(async () => null),
  exists: jest.fn(() => false)
})
