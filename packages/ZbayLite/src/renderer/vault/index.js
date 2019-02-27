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
    await create({ masterPassword, createSource: true })
  }
  try {
    await _vault.unlock(masterPassword, createSource)
  } catch (err) {
    _vault = null
    throw err
  }
}

export const lock = async () => {
  if (_vault) {
    throw Error('Archive not initialized.')
  }
  return _vault.lock()
}

export default ({
  exists,
  create,
  unlock,
  lock
})
