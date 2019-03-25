import { DateTime, Settings } from 'luxon'

Settings.defaultZoneName = 'utc'

export const createChannel = id => ({
  name: `Channel ${id}`,
  description: id % 2 === 0 ? '' : `Channel about ${id}`,
  private: id % 2 === 0,
  unread: id,
  hash: `test-hash-${id}`,
  address: `zs1testaddress${id}`
})

export const now = DateTime.utc(2019, 3, 7, 13, 3, 48)

export const createMessage = (id) => ({
  id,
  createdAt: now.minus({ hours: id }).toISO(),
  description: `This is some message ${id}`,
  address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
})
