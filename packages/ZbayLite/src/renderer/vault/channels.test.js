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

  const getChannels = (identity) => {
    const [identityChannel] = (
      workspace.archive
        .findGroupsByTitle('Channels')[0]
        .getGroups()
        .filter(g => g.getTitle() === identityId)
    )
    return identityChannel.getEntries().map(e => e.toObject().properties)
  }

  const identityId = 'this-is-a-test-id'

  const channels = channelsFactory(vaultMock)

  beforeEach(() => {
    jest.clearAllMocks()
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
  })

  it('bootstraps default channels', async () => {
    await channels.bootstrapChannels(identityId)
    expect(getChannels(identityId)).toMatchSnapshot()
  })
})
