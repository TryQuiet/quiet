import channelsFactory from '../channels'
import contactsFactory from '../contacts'

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
    this.withWorkspace = async (cb) => cb(workspace)
    this.lock = jest.fn()
  }
}
