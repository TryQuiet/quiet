import fs from 'fs'
import path from 'path'
import * as Yup from 'yup'

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
    await create({ masterPassword, network })
  }
  try {
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
    address: entryObj.properties.address,
    signerPrivKey: entryObj.properties.signerPrivKey,
    signerPubKey: entryObj.properties.signerPubKey,
    transparentAddress: entryObj.properties.transparentAddress,
    keys: JSON.parse(entryObj.properties.keys || '{}')
  }
}

export const getVault = withVaultInitialized(() => _vault)

const newIdentitySchema = Yup.object().shape({
  name: Yup.string().required(),
  transparentAddress: Yup.string().required(),
  address: Yup.string().required(),
  signerPrivKey: Yup.string().required(),
  signerPubKey: Yup.string().required(),
  keys: Yup.object().shape({
    sk: Yup.string().required(),
    tpk: Yup.string().required()
  }).required()
})

export const createIdentity = async (identity) => {
  let entry = null
  await newIdentitySchema.validate(identity)
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup.createEntry(identity.name)
      .setProperty('name', identity.name)
      .setProperty('address', identity.address)
      .setProperty('transparentAddress', identity.transparentAddress)
      .setProperty('signerPubKey', identity.signerPubKey)
      .setProperty('signerPrivKey', identity.signerPrivKey)
      .setProperty('keys', JSON.stringify(identity.keys))
    workspace.save()
  })
  return _entryToIdentity(entry)
}

const updateIdentitySchema = Yup.object().shape({
  id: Yup.string().required(),
  name: Yup.string().required(),
  transparentAddress: Yup.string().required(),
  address: Yup.string().required(),
  keys: Yup.object().shape({
    sk: Yup.string().required(),
    tpk: Yup.string().required()
  }).required()
})

export const updateIdentity = async (identity) => {
  let entry = null
  await updateIdentitySchema.validate(identity)
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup.findEntryByID(identity.id)
      .setProperty('name', identity.name)
      .setProperty('address', identity.address)
      .setProperty('transparentAddress', identity.transparentAddress)
      .setProperty('keys', JSON.stringify(identity.keys))
    workspace.save()
  })
  return _entryToIdentity(entry)
}

const updateIdentitySignerKeysSchema = Yup.object().shape({
  signerPubKey: Yup.string().required(),
  signerPrivKey: Yup.string().required()
})

export const updateIdentitySignerKeys = async (identity) => {
  let entry = null
  await updateIdentitySignerKeysSchema.validate(identity)
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup.findEntryByID(identity.id)
      .setProperty('signerPubKey', identity.signerPubKey)
      .setProperty('signerPrivKey', identity.signerPrivKey)
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

export default ({
  // TODO: [refactoring] those using withWorkspace should be moved to Vault
  // as plug in modules
  identity: {
    createIdentity: withVaultInitialized(createIdentity),
    listIdentities: withVaultInitialized(listIdentities),
    updateIdentitySignerKeys: withVaultInitialized(updateIdentitySignerKeys)
  },
  locked,
  getVault,
  remove,
  exists,
  create,
  unlock,
  lock: withVaultInitialized(lock)
})
