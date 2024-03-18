import { LogLevel, LogTransportType } from './enums'
import { TransportConfig } from './types'

export const DEFAULT_LOG_LEVEL: LogLevel = LogLevel.INFO

export const DEFAULT_LOG_TRANSPORTS: TransportConfig[] = [
    {
        type: LogTransportType.CONSOLE_ELECTRON,
        shared: true
    }, 
    {
        type: LogTransportType.FILE,
        shared: true
    }
]

export const DEFAULT_LOG_FILE = 'dist/logs/stdout'
