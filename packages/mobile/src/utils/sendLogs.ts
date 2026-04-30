import { Alert, Platform } from 'react-native'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import DeviceInfo from 'react-native-device-info'

import { createLogger } from './logger'

const logger = createLogger('sendLogs')

const LOGS_DIR = RNFS.DocumentDirectoryPath + '/logs'
const SHARE_DIR = RNFS.CachesDirectoryPath + '/quiet-logs-share'
const SUPPORT_EMAIL = 'logs@tryquiet.org'

export const sendLogs = async (): Promise<void> => {
  let entries: RNFS.ReadDirItem[]
  try {
    entries = await RNFS.readDir(LOGS_DIR)
  } catch (err) {
    logger.error('Failed to read logs directory', err)
    Alert.alert('No logs found', 'There are no log files to send yet.')
    return
  }

  const logFiles = entries.filter(e => e.isFile()).sort((a, b) => a.name.localeCompare(b.name))
  if (logFiles.length === 0) {
    Alert.alert('No logs found', 'There are no log files to send yet.')
    return
  }

  if (await RNFS.exists(SHARE_DIR)) {
    await RNFS.unlink(SHARE_DIR)
  }
  await RNFS.mkdir(SHARE_DIR)

  const header = [
    `App version: ${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`,
    `Platform: ${Platform.OS} ${Platform.Version}`,
    `Device: ${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    'WARNING: Quiet logs may contain onion addresses, identity keys, invitation secrets, and message content.',
    'Only share with people you trust.',
    '',
    `Bundled ${logFiles.length} log file(s).`,
    '',
  ].join('\n')

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const bundlePath = `${SHARE_DIR}/quiet-logs-${stamp}.txt`

  await RNFS.writeFile(bundlePath, header, 'utf8')
  for (const f of logFiles) {
    const sep = `\n\n===== ${f.name} =====\n\n`
    await RNFS.appendFile(bundlePath, sep, 'utf8')
    const contents = await RNFS.readFile(f.path, 'utf8')
    await RNFS.appendFile(bundlePath, contents, 'utf8')
  }

  try {
    await Share.open({
      title: 'Quiet logs',
      subject: `Quiet logs ${new Date().toISOString().slice(0, 10)}`,
      message: header,
      email: SUPPORT_EMAIL,
      url: `file://${bundlePath}`,
      filename: `quiet-logs-${stamp}.txt`,
      type: 'text/plain',
      failOnCancel: false,
    })
  } catch (err) {
    logger.error('Failed to share logs', err)
  }
}
