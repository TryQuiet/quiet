import { createQuietLogger, DEFAULT_INTERNAL_LOG_METHOD, __nodeConsoleLogger } from '@quiet/logger'
// @ts-ignore
import { FileLogger } from 'react-native-file-logger'
import RNFS from 'react-native-fs'

FileLogger.configure({
  captureConsole: true,
  dailyRolling: true,
  maximumFileSize: 2048 * 1024,
  maximumNumberOfFiles: 0,
  logsDirectory: RNFS.DocumentDirectoryPath + '/logs',
})

__nodeConsoleLogger.log(RNFS.DocumentDirectoryPath + '/logs')

export const createLogger = createQuietLogger(DEFAULT_INTERNAL_LOG_METHOD, 'mobile')
