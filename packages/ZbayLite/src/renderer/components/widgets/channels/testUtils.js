export const createChannel = id => ({
  name: `Channel ${id}`,
  description: id % 2 === 0 ? '' : `Channel about ${id}`,
  private: id % 2 === 0,
  unread: id,
  hash: `test-hash-${id}`,
  address: `zs1testaddress${id}`
})
