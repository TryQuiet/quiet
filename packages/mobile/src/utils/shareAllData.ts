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
  'PRIVACY/SECURITY WARNING: Do **NOT** use this feature with a live community you care about. This feature is for internal use on Alpha builds only. It will share ALL QUIET APPLICATION DATA, including:',
  '',
  '  • Your identity private keys (anyone with these can impersonate you in your communities, post as you, and read your future messages)',
  '  • All message content, channels, and history stored on this device',
  '  • Community membership, peer info, and onion addresses',
  '  • Invitation secrets and Tor state',
  '',
  'Sending this to someone gives them permanent ability to act as you in your communities.',
  'Only share with a Quiet developer you trust.',
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
  const readmePath = `${SHARE_DIR}/README.txt`

  const headerLines = [
    ...WARNING_LINES,
    '',
    '---',
    '',
    `App version: ${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`,
    `Platform: ${Platform.OS} ${Platform.Version}`,
    `Device: ${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    `Contact: ${SUPPORT_EMAIL}`,
    '',
  ]
  const header = headerLines.join('\n')
  await RNFS.writeFile(readmePath, header, 'utf8')

  const sources: string[] = [readmePath, DATA_DIR]
  if (await RNFS.exists(LOGS_DIR)) {
    sources.push(LOGS_DIR)
  }

  Alert.alert(
    'Preparing archive',
    'Zipping the data directory. This can take a while for large communities — leave the app open until the share sheet appears.'
  )

  const zipPath = `${SHARE_DIR}/quiet-data-${stamp}.zip`
  try {
    logger.info(`Zipping ${sources.length} source(s) into ${zipPath}`)
    const start = Date.now()
    await zip(sources, zipPath)
    logger.info(`Zip complete in ${Date.now() - start}ms`)
  } catch (err) {
    logger.error('Failed to zip data directory', err)
    Alert.alert('Could not zip data', String(err))
    return
  }

  try {
    await Share.open({
      title: 'Quiet ALL DATA',
      subject: `Quiet ALL DATA ${new Date().toISOString().slice(0, 10)} — contains identity keys`,
      message: header,
      url: `file://${zipPath}`,
      filename: `quiet-data-${stamp}.zip`,
      type: 'application/zip',
      failOnCancel: false,
    })
  } catch (err) {
    logger.error('Failed to share data archive', err)
  }
}
