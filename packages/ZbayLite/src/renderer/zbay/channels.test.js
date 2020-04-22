import { uriToChannel } from './channels'
import { deflate } from '../compression'

describe('channels', () => {
  describe('- uriToChannel', () => {
    const channel = {
      name: 'Philosophy',
      ivk: 'testivk'
    }

    it('decodes the channel', async () => {
      const hash = await deflate(channel)
      const uri = `${hash}`

      const result = await uriToChannel(uri)

      expect(result).toMatchSnapshot()
    })

    it('fails on incorrect uri', async () => {
      const uri = `randomhash`

      expect.assertions(1)
      try {
        await uriToChannel(uri)
      } catch (error) {
        expect(error).toMatchSnapshot()
      }
    })

    it('fails on incorrect channel format', async () => {
      const channelHash = await deflate({ key: 'value' })
      const uri = `${channelHash}`

      expect.assertions(1)
      try {
        await uriToChannel(uri)
      } catch (error) {
        expect(error).toMatchSnapshot()
      }
    })
  })
})
