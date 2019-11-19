import channelsFactory from '../channels'
import contactsFactory from '../contacts'
import offersFactory from '../offers'
import transactionsTimestampsFactory from '../transactionsTimestamps'
import removedChannelsTimestampsFactory from '../deletedChannels'

const workspace = jest.mock()
workspace.save = jest.fn()

export const mock = {
  workspace,
  setArchive: (archive) => {
    workspace.archive = archive
  }
}

export default class Vault {
  constructor (sourceCredentials, archiveCredentials) {
    this.channels = channelsFactory(this)
    this.contacts = contactsFactory(this)
    this.offers = offersFactory(this)
    this.transactionsTimestamps = transactionsTimestampsFactory(this)
    this.disabledChannels = removedChannelsTimestampsFactory(this)
    this.withWorkspace = async (cb) => cb(workspace)
    this.lock = jest.fn()
  }
}
