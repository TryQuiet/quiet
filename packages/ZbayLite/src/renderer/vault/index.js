import fs from 'fs'
import path from 'path'

import { remote } from 'electron'

import { passwordToSecureStrings } from './marshalling'
import Vault from './vault'

const getVaultPath = () => path.join(remote.app.getPath('userData'), 'vault.bcup')

let _vault = null

export const exists = () => {
  const userDir = remote.app.getPath('userData')
  const vaultPath = path.join(userDir, 'vault.bcup')
  return fs.existsSync(vaultPath)
}

export const create = async ({ masterPassword }) => {
  if (_vault !== null) {
    throw Error('Archive already initialized.')
  }
  const datasourceObj = {
    type: 'ipc',
    path: getVaultPath()
  }
  const [sourceCredentialsStr, passwordCredentialsStr] = await passwordToSecureStrings({
    masterPassword,
    datasourceObj
  })
  _vault = new Vault(sourceCredentialsStr, passwordCredentialsStr)
}

export const unlock = async ({ masterPassword, createSource = false }) => {
  if (!_vault) {
    await create({ masterPassword })
  }
  try {
    await _vault.unlock(masterPassword, createSource)
  } catch (err) {
    _vault = null
    throw err
  }
}

export const lock = async () => {
  if (!_vault) {
    throw Error('Archive not initialized.')
  }
  return _vault.lock()
}

const _entryToIdentity = entry => {
  const entryObj = entry.toObject()
  return {
    id: entryObj.id,
    name: entryObj.properties.name,
    address: entryObj.properties.address
  }
}
export const createIdentity = async ({ name, address }) => {
  if (!_vault) {
    throw Error('Archive not initialized.')
  }
  let entry = null
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup.createEntry(name)
      .setProperty('name', name)
      .setProperty('address', address)
    workspace.save()
  })
  return _entryToIdentity(entry)
}

export const listIdentities = async () => {
  if (!_vault) {
    throw Error('Archive not initialized.')
  }
  let identities = []
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    identities = identitiesGroup.getEntries()
  })
  return identities.map(_entryToIdentity)
}

export const remove = async () => {
  if (_vault) {
    await lock()
    _vault = null
  }
}

export default ({
  identity: {
    createIdentity,
    listIdentities
  },
  remove,
  exists,
  create,
  unlock,
  lock
})
