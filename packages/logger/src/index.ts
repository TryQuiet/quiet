import debug from 'debug'
import { DateTime } from 'luxon'

const Tail = require('tail').Tail
import { ConsoleForElectron } from 'winston-console-for-electron'
import winston from 'winston'

import { GenerateLoggerConfig, LoggingHandlerConfig, TailLoggerFunction } from './types'
import { DEFAULT_LOG_FILE, DEFAULT_LOG_LEVEL, DEFAULT_LOG_TRANSPORTS } from './const'
import { LogTransportType, LogLevel } from './enums'

export type Logger = debug.Debugger & {
  error: debug.Debugger
}

export const consoleLogger =
  (packageName: string) =>
  (module: string): Logger => {
    debug('quiet')(`Initializing debug logger for package ${packageName} and module ${module}`)
    const logger = Object.assign(debug(`${packageName}:${module}`), {
      error: debug(`${packageName}:${module}:err`),
    })
    return logger
  }

export const logger = (packageName: string): ((arg: string) => Logger) => {
  return consoleLogger(packageName)
}

export class LoggingHandler {
  public packageName: string
  public baseTransports: LogTransportType[]
  public defaultLogLevel: LogLevel
  public defaultLogFile: string

  constructor(baseConfig: LoggingHandlerConfig) {
    this.packageName = baseConfig.packageName
    this.baseTransports = baseConfig.defaultLogTransportTypes || DEFAULT_LOG_TRANSPORTS
    this.defaultLogLevel = baseConfig.defaultLogLevel || DEFAULT_LOG_LEVEL
    this.defaultLogFile = baseConfig.defaultLogFile || DEFAULT_LOG_FILE
  }

  public initLogger(moduleName: string): winston.Logger
  public initLogger(moduleNames: string[]): winston.Logger
  public initLogger(config: GenerateLoggerConfig): winston.Logger
  public initLogger(moduleNameOrConfig: GenerateLoggerConfig | string | string[]): winston.Logger {
    let config: GenerateLoggerConfig
    if (typeof moduleNameOrConfig === 'string') {
      config = {
        moduleNames: [moduleNameOrConfig],
      } as GenerateLoggerConfig
    } else if (moduleNameOrConfig instanceof Array) {
      config = {
        moduleNames: moduleNameOrConfig,
      } as GenerateLoggerConfig
    } else {
      config = moduleNameOrConfig
    }

    const name = this.getLoggerName(config.moduleNames)
    config = this.buildModuleLoggerConfig(config, name)

    return winston.createLogger({
      defaultMeta: {
        label: name,
      },
      level: config.logLevel,
      format: this.getFormats(),
      transports: this.getTransports(config, name),
    })
  }

  private buildModuleLoggerConfig(config: GenerateLoggerConfig, name: string): GenerateLoggerConfig {
    const logLevel = this.getLogLevel(config, name)
    const transports: LogTransportType[] = config.transports || this.baseTransports
    const logFile = config.logFile || this.defaultLogFile
    return {
      moduleNames: config.moduleNames,
      logLevel,
      transports,
      logFile,
    }
  }

  private getLoggerName(moduleNames: string[]) {
    return `${this.packageName}:${moduleNames.join(':')}`
  }

  private getFormats() {
    return winston.format.combine(
      winston.format(info => {
        info.level = info.level.toUpperCase()
        return info
      })(),
      winston.format.colorize(),
      winston.format.printf(info => {
        return `${DateTime.utc().toISO()} ${info.level} ${info.label} ${info.message}`
      })
    )
  }

  private getLogLevel(config: GenerateLoggerConfig, name: string): LogLevel {
    if (debug.enabled(name)) {
      return LogLevel.DEBUG
    }

    return config.logLevel || this.defaultLogLevel
  }

  private getTransports(config: GenerateLoggerConfig, name: string): winston.transport[] {
    const transports: winston.transport[] = []
    if (!config.transports || config.transports.length === 0) {
      throw new Error(`No log transports configured for module logger ${name}`)
    }

    for (const transportType of config.transports) {
      switch (transportType) {
        case LogTransportType.CONSOLE:
          transports.push(new winston.transports.Console())
          break
        case LogTransportType.CONSOLE_ELECTRON:
          transports.push(
            new ConsoleForElectron({
              prefix: '',
            })
          )
          break
        case LogTransportType.FILE:
          transports.push(new winston.transports.File({ filename: config.logFile }))
          break
        default:
          console.error(`Unknown log transport type ${transportType}`)
          break
      }
    }

    return transports
  }

  public static tailLogFile(fileName = 'dist/logs/stdout', consoleFunction: TailLoggerFunction = console.log): void {
    const tailableFileName = fileName || DEFAULT_LOG_FILE
    if (process.env.NODE_ENV === 'development') {
      consoleFunction(`${DateTime.utc().toISO()} DEVELOPMENT: tailing log file ${tailableFileName}`)
      const tail = new Tail(tailableFileName)

      tail.on('line', function (data: any) {
        consoleFunction(data)
      })
    } else {
      consoleFunction(`${DateTime.utc().toISO()} Not running in development, not tailing log file ${tailableFileName}`)
    }
  }
}

export * from './enums'
export * from './const'
export * from './types'

export default logger
