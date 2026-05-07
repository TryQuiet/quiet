import { Alert, Platform } from 'react-native'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import { zip } from 'react-native-zip-archive'
import DeviceInfo from 'react-native-device-info'

import { createLogger } from './logger'

const logger = createLogger('shareAllData')

const DATA_DIR = RNFS.DocumentDirectoryPath + '/backend/files7'
const LOGS_DIR = RNFS.DocumentDirectoryPath + '/logs'
const SHARE_DIR = RNFS.CachesDirectoryPath + '/quiet-data-share'
const SUPPORT_EMAIL = 'logs@tryquiet.org'

const WARNING_LINES = [
  'EXTREME PRIVACY WARNING — read before sending.',
  '',
  'This archive contains the FULL Quiet data directory, which includes:',
  '  • Your identity private keys (anyone with these can IMPERSONATE you in your communities, post as you, and read your future messages)',
  '  • All message content, channels, and history stored on this device',
  '  • Community membership, peer info, and onion addresses',
  '  • Invitation secrets and Tor state',
  '',
  'Sending this to someone gives them PERMANENT ability to act as you in your communities.',
  'Only share with a Quiet developer you trust. Consider rotating your identity afterwards.',
]

export const shareAllData = async (): Promise<void> => {
  if (!(await RNFS.exists(DATA_DIR))) {
    Alert.alert('No data found', 'There is no Quiet data directory on this device yet.')
    return
  }

  if (await RNFS.exists(SHARE_DIR)) {
    await RNFS.unlink(SHARE_DIR)
  }
  await RNFS.mkdir(SHARE_DIR)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const stagingDir = `${SHARE_DIR}/quiet-data-${stamp}`
  await RNFS.mkdir(stagingDir)

  const headerLines = [
    `Please send to ${SUPPORT_EMAIL}`,
    '',
    `App version: ${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`,
    `Platform: ${Platform.OS} ${Platform.Version}`,
    `Device: ${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    ...WARNING_LINES,
    '',
  ]
  const header = headerLines.join('\n')
  await RNFS.writeFile(`${stagingDir}/README.txt`, header, 'utf8')

  await RNFS.mkdir(`${stagingDir}/data`)
  await RNFS.copyFile(DATA_DIR, `${stagingDir}/data`)

  if (await RNFS.exists(LOGS_DIR)) {
    await RNFS.mkdir(`${stagingDir}/logs`)
    await RNFS.copyFile(LOGS_DIR, `${stagingDir}/logs`)
  }

  const zipPath = `${SHARE_DIR}/quiet-data-${stamp}.zip`
  try {
    await zip(stagingDir, zipPath)
  } catch (err) {
    logger.error('Failed to zip data directory', err)
    Alert.alert('Could not zip data', 'See logs for details.')
    return
  }

  try {
    await RNFS.unlink(stagingDir)
  } catch (err) {
    logger.warn('Failed to clean up staging dir', err)
  }

  try {
    await Share.open({
      title: 'Quiet ALL DATA',
      subject: `Quiet ALL DATA ${new Date().toISOString().slice(0, 10)} — contains identity keys`,
      message: header,
      email: SUPPORT_EMAIL,
      url: `file://${zipPath}`,
      filename: `quiet-data-${stamp}.zip`,
      type: 'application/zip',
      failOnCancel: false,
    })
  } catch (err) {
    logger.error('Failed to share data archive', err)
  }
}
