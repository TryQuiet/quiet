import { createChannel } from './testUtils'
import { inflate, deflate } from './compression'

describe('compression', () => {
  it('is symetrical', async () => {
    const channel = createChannel(0)
    const serialized = await deflate(channel)
    expect(inflate(serialized)).resolves.toEqual(channel)
  })
})
