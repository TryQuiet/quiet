import fs from 'fs-extra'
import os from 'os'
import electronStore from '../../shared/electronStore'
import config from '../config'
import { exec } from 'child_process'

const walletPathDefault = {
  darwin: `${process.env.HOME ||
    process.env.USERPROFILE}/Library/Application Support/Zcash/zbayMainnet`,
  linux: `${process.env.HOME || process.env.USERPROFILE}/.zcash/zbayMainnet`,
  win32: `${os.userInfo().homedir}\\AppData\\Roaming\\Zcash\\zbayMainnet`
}

const walletPathCustom = {
  darwin: `${process.env.HOME ||
    process.env.USERPROFILE}/Library/Application Support/ZbayData/zbayMainnet`,
  linux: `${process.env.HOME || process.env.USERPROFILE}/ZbayData/zbayMainnet`,
  win32: `${os.userInfo().homedir}\\AppData\\Roaming\\ZbayData\\zbayMainnet`
}

const walletPathBackup = {
  darwin: `${process.env.HOME ||
    process.env.USERPROFILE}/Library/Application Support/ZbayBackup/zbayMainnet_recover`,
  linux: `${process.env.HOME || process.env.USERPROFILE}/ZbayBackup/zbayMainnet_recover`,
  win32: `${os.userInfo().homedir}\\AppData\\Roaming\\ZbayBackup\\zbayMainnet_recover`
}

const makeWalletCopy = () => {
  const blockchainConfiguration = electronStore.get('blockchainConfiguration')
  const targetPath = blockchainConfiguration === config.BLOCKCHAIN_STATUSES.DEFAULT_LOCATION_SELECTED ? walletPathDefault[process.platform] : walletPathCustom[process.platform]
  const destinationPath = walletPathBackup[process.platform]
  try {
    fs.copySync(targetPath, destinationPath)
  } catch (err) {
    throw err
  }
}

const replaceWalletFile = () => {
  const blockchainConfiguration = electronStore.get('blockchainConfiguration')
  const backupPath = walletPathBackup[process.platform]
  const targetToReplacement = blockchainConfiguration === config.BLOCKCHAIN_STATUSES.DEFAULT_LOCATION_SELECTED ? walletPathDefault[process.platform] : walletPathCustom[process.platform]
  try {
    if (fs.existsSync(backupPath)) {
      fs.removeSync(targetToReplacement)
      fs.copySync(backupPath, targetToReplacement)
    }
  } catch (err) {
    throw err
  }
}

const checkIfProcessIsRunning = (status) => {
  const query = 'zcashd'
  let platform = process.platform
  let cmd = ''
  switch (platform) {
    case 'win32' : cmd = `tasklist`; break
    case 'darwin' : cmd = `ps -ax`; break
    case 'linux' : cmd = `ps -A`; break
    default: break
  }
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      throw err
    } else {
      status(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1)
    }
  })
}

export default {
  checkIfProcessIsRunning,
  replaceWalletFile,
  makeWalletCopy
}
