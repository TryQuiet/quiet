import winston from 'winston'
import * as path from 'path'
import { ConsoleForElectron } from 'winston-console-for-electron'
require('winston-daily-rotate-file')

import { LogTransportType } from './enums'
import { SharedLogTransportMap, TransportConfig } from './types'
import { DEFAULT_LOG_FILE } from './const'

export class LogTransports {
  public sharedTransports: SharedLogTransportMap = {}

  constructor(
    public logFile?: string,
    public rotatedLogFile?: string
  ) {}

  public initTransport(config: TransportConfig, logPath?: string): winston.transport {
    if (config.shared && this.sharedTransports[config.type] != null) {
      return this.sharedTransports[config.type] as winston.transport
    }

    const transport = this.generateTransport(config.type, config.fileName, logPath)
    if (config.shared) {
      this.sharedTransports[config.type] = transport as any
    }
    return transport
  }

  private generateTransport(type: LogTransportType, fileName?: string, logPath?: string): winston.transport {
    switch (type) {
      case LogTransportType.CONSOLE:
        return new winston.transports.Console()
      case LogTransportType.CONSOLE_ELECTRON:
        return new ConsoleForElectron({
          prefix: '',
        })
      case LogTransportType.FILE:
        return new winston.transports.File({
          filename: fileName || this.logFile || DEFAULT_LOG_FILE,
        })
      case LogTransportType.ROTATE_FILE:
        return new winston.transports.DailyRotateFile({
          filename: fileName || this.rotatedLogFile || DEFAULT_LOG_FILE,
          createSymlink: true,
          symlinkName: fileName || this.rotatedLogFile || DEFAULT_LOG_FILE,
          dirname: logPath,
        })
      default:
        throw new Error(`Unknown log transport type ${type}`)
    }
  }

  private getLogFilePath(fileName?: string, logPath?: string): string | undefined {
    let file: string | undefined = undefined
    if ((fileName && !logPath) || (!fileName && logPath)) {
      throw new Error('If fileName or logPath is provided you must provide both!')
    } else if (fileName && logPath) {
      file = path.join(logPath, fileName)
    } else if (fileName) {
      file = fileName
    }

    return file
  }
}
