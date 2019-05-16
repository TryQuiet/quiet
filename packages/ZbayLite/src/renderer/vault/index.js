import fs from 'fs'
import path from 'path'

import { remote } from 'electron'

import { passwordToSecureStrings } from './marshalling'
import Vault from './vault'

const getVaultPath = (network) => path.join(remote.app.getPath('userData'), `vault-${network}.bcup`)

let _vault = null

export const withVaultInitialized = (fn) => (...args) => {
  if (!_vault) {
    throw Error('Archive not initialized.')
  }
  return fn(...args)
}

export const exists = (network) => fs.existsSync(getVaultPath(network))

export const create = async ({ masterPassword, network }) => {
  if (_vault !== null) {
    throw Error('Archive already initialized.')
  }
  const datasourceObj = {
    type: 'ipc',
    path: getVaultPath(network)
  }
  const [sourceCredentialsStr, passwordCredentialsStr] = await passwordToSecureStrings({
    masterPassword,
    datasourceObj
  })
  _vault = new Vault(sourceCredentialsStr, passwordCredentialsStr)
}

export const unlock = async ({ masterPassword, network, createSource = false }) => {
  if (!_vault) {
    console.log('creating vault')
    await create({ masterPassword, network })
  }
  try {
    console.log('unlocking vault')
    await _vault.unlock(masterPassword, createSource)
  } catch (err) {
    _vault = null
    throw err
  }
}

export const lock = async () => _vault.lock()

const _entryToIdentity = entry => {
  const entryObj = entry.toObject()
  return {
    id: entryObj.id,
    name: entryObj.properties.name,
    address: entryObj.properties.address
  }
}

export const getVault = withVaultInitialized(() => _vault)

export const createIdentity = async ({ name, address }) => {
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

export const locked = () => {
  return _vault === null || _vault.locked()
}

// TODO: display channels on frontend
export default ({
  // TODO: [refactoring] those using withWorkspace should be moved to Vault
  // as plug in modules
  identity: {
    createIdentity: withVaultInitialized(createIdentity),
    listIdentities: withVaultInitialized(listIdentities)
  },
  locked,
  getVault,
  remove,
  exists,
  create,
  unlock,
  lock: withVaultInitialized(lock)
})
