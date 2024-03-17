import { LogLevel, LogTransportType } from './enums'

export const DEFAULT_LOG_LEVEL: LogLevel = LogLevel.INFO

export const DEFAULT_LOG_TRANSPORTS: LogTransportType[] = [LogTransportType.CONSOLE_ELECTRON, LogTransportType.FILE]

export const DEFAULT_LOG_FILE = 'dist/logs/stdout'
