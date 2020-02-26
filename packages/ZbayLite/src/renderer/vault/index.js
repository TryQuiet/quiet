import fs from 'fs'
import path from 'path'
import * as Yup from 'yup'
import { DateTime } from 'luxon'

import { remote } from 'electron'

import { passwordToSecureStrings } from './marshalling'
import { formSchema as shippingDataSchema } from '../components/widgets/settings/ShippingSettingsForm'
import Vault from './vault'

const getVaultPath = network => path.join(remote.app.getPath('userData'), `vault-${network}.bcup`)

let _vault = null

export const withVaultInitialized = fn => (...args) => {
  if (!_vault) {
    throw Error('Archive not initialized.')
  }
  return fn(...args)
}

export const exists = network => fs.existsSync(getVaultPath(network))

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
    keys: JSON.parse(entryObj.properties.keys || '{}'),
    shippingData: JSON.parse(entryObj.properties.shippingData || '{}'),
    donationAllow: entryObj.properties.donationAllow || 'true',
    shieldingTax: entryObj.properties.shieldingTax || 'true',
    donationAddress:
      entryObj.properties.donationAddress ||
      (parseInt(process.env.ZBAY_IS_TESTNET)
        ? 'ztestsapling1e2fr65z5t537cyahpu55fm335a2z26293nvj4wu0jjw55s66r669kaw4k26hmgnk23zeqw2k74n'
        : 'zs19wdfjhfqa6afgyv2vw07f68zmwhudgqwa5sve3zgz8y856nhn3j73yr9tavugfs8nunn6pju34a') // TODO add real donation address
  }
}

export const getVault = withVaultInitialized(() => _vault)

const newIdentitySchema = Yup.object().shape({
  name: Yup.string().required(),
  transparentAddress: Yup.string().required(),
  address: Yup.string().required(),
  signerPrivKey: Yup.string().required(),
  signerPubKey: Yup.string().required(),
  keys: Yup.object()
    .shape({
      sk: Yup.string().required(),
      tpk: Yup.string().required()
    })
    .required()
})

export const createIdentity = async identity => {
  let entry = null
  await newIdentitySchema.validate(identity)
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup
      .createEntry(identity.name)
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
  keys: Yup.object()
    .shape({
      sk: Yup.string().required(),
      tpk: Yup.string().required()
    })
    .required()
})

export const updateIdentity = async identity => {
  let entry = null
  await updateIdentitySchema.validate(identity)
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup
      .findEntryByID(identity.id)
      .setProperty('name', identity.name)
      .setProperty('address', identity.address)
      .setProperty('transparentAddress', identity.transparentAddress)
      .setProperty('keys', JSON.stringify(identity.keys))
    workspace.save()
  })
  return _entryToIdentity(entry)
}

export const updateShippingData = async (identityId, shippingData) => {
  let entry = null
  await shippingDataSchema.validate(shippingData)
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup
      .findEntryByID(identityId)
      .setProperty('shippingData', JSON.stringify(shippingData))
    workspace.save()
  })
  return _entryToIdentity(entry)
}

const updateIdentitySignerKeysSchema = Yup.object().shape({
  signerPubKey: Yup.string().required(),
  signerPrivKey: Yup.string().required()
})

export const updateIdentitySignerKeys = async identity => {
  let entry = null
  await updateIdentitySignerKeysSchema.validate(identity)
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup
      .findEntryByID(identity.id)
      .setProperty('signerPubKey', identity.signerPubKey)
      .setProperty('signerPrivKey', identity.signerPrivKey)
    workspace.save()
  })
  return _entryToIdentity(entry)
}

const updateDonationSchema = Yup.boolean().required()

export const updateDonation = async (identityId, allow) => {
  let entry = null
  await updateDonationSchema.validate(allow)
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup.findEntryByID(identityId).setProperty('donationAllow', allow.toString())
    workspace.save()
  })
  return _entryToIdentity(entry)
}
export const updateShieldingTax = async (identityId, allow) => {
  let entry = null
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup.findEntryByID(identityId).setProperty('shieldingTax', allow.toString())
    workspace.save()
  })
  return _entryToIdentity(entry)
}

export const updateDonationAddress = async (identityId, address) => {
  let entry = null
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup
      .findEntryByID(identityId)
      .setProperty('donationAddress', address.toString())
    workspace.save()
  })
  return _entryToIdentity(entry)
}
export const updateLastLogin = async identityId => {
  let entry = null
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup.findEntryByID(identityId).setProperty(
      'lastLogin',
      DateTime.utc()
        .toSeconds()
        .toString()
    )
    workspace.save()
  })
  return _entryToIdentity(entry)
}
export const getLastLogin = async identityId => {
  let entry = null
  await _vault.withWorkspace(workspace => {
    const [identitiesGroup] = workspace.archive.findGroupsByTitle('Identities')
    entry = identitiesGroup.findEntryByID(identityId).getProperty('lastLogin')
  })
  return entry
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

export default {
  // TODO: [refactoring] those using withWorkspace should be moved to Vault
  // as plug in modules
  identity: {
    createIdentity: withVaultInitialized(createIdentity),
    getLastLogin: withVaultInitialized(getLastLogin),
    updateLastLogin: withVaultInitialized(updateLastLogin),
    listIdentities: withVaultInitialized(listIdentities),
    updateShippingData: withVaultInitialized(updateShippingData),
    updateIdentitySignerKeys: withVaultInitialized(updateIdentitySignerKeys),
    updateDonation: withVaultInitialized(updateDonation),
    updateDonationAddress: withVaultInitialized(updateDonationAddress),
    updateShieldingTax: withVaultInitialized(updateShieldingTax)
  },
  locked,
  getVault,
  remove,
  exists,
  create,
  unlock,
  lock: withVaultInitialized(lock)
}
