import ChannelQueue from '@buttercup/channel-queue'

import './datasource' // register datasource

import {
  credentialsFromSecureStrings,
  credentialsToSecureStrings,
  credentialsToWorkspace
} from './marshalling'
import { Credentials } from '../vendor/buttercup'
import channelsFactory from './channels'
import contactsFactory from './contacts'
import offersFactory from './offers'

export default class Vault {
  constructor (sourceCredentials, archiveCredentials) {
    if (!Credentials.isSecureString(sourceCredentials)) {
      throw new Error('Failed constructing vault: Source credentials not in encrypted form')
    }
    if (!Credentials.isSecureString(archiveCredentials)) {
      throw new Error('Failed constructing vault: Archive credentials not in encrypted form')
    }
    this._stateQueue = new ChannelQueue()
    this._workspace = null
    this._sourceCredentials = sourceCredentials
    this._archiveCredentials = archiveCredentials
    this.channels = channelsFactory(this)
    this.contacts = contactsFactory(this)
    this.offers = offersFactory(this)
  }

  _enqueueStateChange (cb) {
    return this._stateQueue.channel('state').enqueue(cb)
  }

  locked () {
    return this._workspace === null
  }

  unlock (masterPassword, createSource = false) {
    return this._enqueueStateChange(async () => {
      const [sourceCredentials, archiveCredentials] = await credentialsFromSecureStrings({
        sourceCredentials: this._sourceCredentials,
        archiveCredentials: this._archiveCredentials,
        masterPassword
      })
      const workspace = await credentialsToWorkspace({
        sourceCredentials,
        archiveCredentials,
        createSource
      })
      this._workspace = workspace
      this._sourceCredentials = sourceCredentials
      this._archiveCredentials = archiveCredentials
    })
  }

  lock () {
    return this._enqueueStateChange(async () => {
      const [secSourceCredentials, secArchiveCredentials] = await credentialsToSecureStrings({
        sourceCredentials: this._sourceCredentials,
        archiveCredentials: this._archiveCredentials

      })
      await this._workspace.save()
      this._workspace = null
      this._archiveCredentials = secArchiveCredentials
      this._sourceCredentials = secSourceCredentials
    })
  }

  withWorkspace (cb) {
    return this._enqueueStateChange(async () => cb(this._workspace))
  }
}
