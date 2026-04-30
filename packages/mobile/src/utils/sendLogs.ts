import { Alert, Platform } from 'react-native'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import DeviceInfo from 'react-native-device-info'

import { createLogger } from './logger'

const logger = createLogger('sendLogs')

const LOGS_DIR = RNFS.DocumentDirectoryPath + '/logs'

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

  const metadata = [
    `App version: ${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`,
    `Platform: ${Platform.OS} ${Platform.Version}`,
    `Device: ${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    'WARNING: Quiet logs may contain onion addresses, identity keys, invitation secrets, and message content.',
    'Only share with people you trust.',
    '',
  ].join('\n')

  const metadataPath = `${RNFS.CachesDirectoryPath}/quiet-log-metadata.txt`
  await RNFS.writeFile(metadataPath, metadata, 'utf8')

  const urls = [`file://${metadataPath}`, ...logFiles.map(f => `file://${f.path}`)]
  const filenames = ['quiet-log-metadata.txt', ...logFiles.map(f => f.name)]

  try {
    await Share.open({
      title: 'Quiet logs',
      subject: `Quiet logs ${new Date().toISOString().slice(0, 10)}`,
      message: metadata,
      urls,
      filenames,
      failOnCancel: false,
    })
  } catch (err) {
    logger.error('Failed to share logs', err)
  }
}
