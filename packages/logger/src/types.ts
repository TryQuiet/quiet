import { LogLevel, LogTransportType } from './enums'

export interface LoggingHandlerConfig {
  packageName: string
  defaultLogTransportTypes?: LogTransportType[]
  defaultLogLevel?: LogLevel
  defaultLogFile?: string
}

export interface GenerateLoggerConfig {
  moduleNames: string[]
  logLevel?: LogLevel
  transports?: LogTransportType[]
  logFile?: string
}

export type TailLoggerFunction = (...args: any[]) => void
