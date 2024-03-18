import winston from 'winston'
import { ConsoleForElectron } from 'winston-console-for-electron'
import * as DailyRotateFile from 'winston-daily-rotate-file'
import { LogLevel, LogTransportType } from './enums'

export interface TransportConfig {
  type: LogTransportType
  shared?: boolean
  fileName?: string
}

export interface LoggingHandlerConfig {
  packageName: string
  defaultLogTransports?: TransportConfig[]
  defaultLogLevel?: LogLevel
  defaultLogFile?: string
}

export interface GenerateLoggerConfig {
  moduleNames: string[]
  logLevel?: LogLevel
  transports?: TransportConfig[]
  logFile?: string
}

export type TailLoggerFunction = (...args: any[]) => void

export interface SharedLogTransportMap {
  [LogTransportType.CONSOLE]?: winston.transports.ConsoleTransportInstance
  [LogTransportType.CONSOLE_ELECTRON]?: ConsoleForElectron
  [LogTransportType.FILE]?: winston.transports.FileTransportInstance
  [LogTransportType.ROTATE_FILE]?: DailyRotateFile
}
