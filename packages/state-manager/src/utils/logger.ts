import { LogLevel, LogTransportType, LoggingHandler } from '@quiet/logger'

export enum LoggerModuleName {
  // top-level module names
  APP = 'app',
  APP_CONNECTION = 'appConnection',
  COMMUNITIES = 'communities',
  PUBLIC_CHANNELS = 'publicChannels',
  NETWORK = 'network',
  IDENTITY = 'identity',
  SOCKET = 'socket',
  USER_PROFILES = 'userProfiles',
  FILES = 'files',
  MESSAGES = 'messages',
  USERS = 'users',

  // sub module names
  SAGA = 'saga',
  SELECTORS = 'selectors',
  ADAPTER = 'adapter',
  SLICE = 'slice',
  TRANSFORM = 'transform',
  MASTER = 'master',
}

const PACKAGE_NAME = 'state-manager'
export const loggingHandler = new LoggingHandler({
  packageName: PACKAGE_NAME,
  defaultLogLevel: LogLevel.INFO,
  defaultLogTransports: [{
    type: LogTransportType.FILE,
    shared: true,
  }],
})
