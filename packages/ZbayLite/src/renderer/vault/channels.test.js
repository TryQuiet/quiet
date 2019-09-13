/* eslint import/first: 0 */
jest.mock('../zcash')

import { DateTime } from 'luxon'

import { createArchive } from './marshalling'
import channelsFactory from './channels'

import testUtils from '../testUtils'

describe('channels', () => {
  const workspace = jest.mock()
  workspace.save = jest.fn()
  const vaultMock = {
    withWorkspace: async (cb) => cb(workspace),
    lock: async (arg) => arg
  }

  const identityId = 'this-is-a-test-id'

  const channels = channelsFactory(vaultMock)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now)
    workspace.archive = createArchive()
  })

  describe('importChannel', () => {
    const channel = testUtils.channels.createChannel(1)

    it('when no group for identity', async () => {
      await channels.importChannel(identityId, channel)
      const [identityChannel] = (
        workspace.archive
          .findGroupsByTitle('Channels')[0]
          .getGroups()
          .filter(g => g.getTitle() === identityId)
      )
      const [importedChannel] = identityChannel.getEntries().map(e => e.toObject().properties)
      expect(importedChannel).toMatchSnapshot()
    })

    it('consecutive imports', async () => {
      await channels.importChannel(identityId, channel)
      await channels.importChannel(identityId, testUtils.channels.createChannel(2))
      const [identityChannel] = (
        workspace.archive
          .findGroupsByTitle('Channels')[0]
          .getGroups()
          .filter(g => g.getTitle() === identityId)
      )
      const importedChannels = identityChannel.getEntries().map(e => e.toObject().properties)
      expect(importedChannels).toMatchSnapshot()
    })

    it('remove channel', async () => {
      await channels.importChannel(identityId, channel)
      const [identityChannel] = (
        workspace.archive
          .findGroupsByTitle('Channels')[0]
          .getGroups()
          .filter(g => g.getTitle() === identityId)
      )
      const importedChannels = identityChannel.getEntries().map(e => e.toObject().properties)
      await channels.removeChannel({ identityId, channelId: channel.address })
      const channelsAfterDelete = identityChannel.getEntries().map(e => e.toObject().properties)
      expect(importedChannels).toMatchSnapshot()
      expect(channelsAfterDelete).toMatchSnapshot()
    })
  })
})
