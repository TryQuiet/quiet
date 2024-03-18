import debug from 'debug'
import { DateTime } from 'luxon'
import winston from 'winston'

import { GenerateLoggerConfig, LoggingHandlerConfig, TransportConfig } from './types'
import { DEFAULT_LOG_FILE, DEFAULT_LOG_LEVEL, DEFAULT_LOG_TRANSPORTS } from './const'
import { LogLevel } from './enums'
import { LogTransports } from './transports'

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

const transportManager = new LogTransports()

export class LoggingHandler {
  public packageName: string
  public baseTransports: TransportConfig[]
  public defaultLogLevel: LogLevel
  public defaultLogFile: string
  public logPath: string

  constructor(baseConfig: LoggingHandlerConfig) {
    this.packageName = baseConfig.packageName
    this.baseTransports = baseConfig.defaultLogTransports || DEFAULT_LOG_TRANSPORTS
    this.defaultLogLevel = baseConfig.defaultLogLevel || DEFAULT_LOG_LEVEL
    this.defaultLogFile = baseConfig.defaultLogFile || DEFAULT_LOG_FILE
    this.logPath = baseConfig.logPath
  }

  public initLogger(moduleName: string): winston.Logger
  public initLogger(moduleNames: string[]): winston.Logger
  public initLogger(baseConfig: GenerateLoggerConfig): winston.Logger
  public initLogger(moduleNameOrConfig: GenerateLoggerConfig | string | string[]): winston.Logger {
    const loggerOptions = this.buildLoggerOptions(moduleNameOrConfig)
    return winston.createLogger(loggerOptions)
  }

  private buildConfig(moduleNameOrConfig: GenerateLoggerConfig | string | string[]): GenerateLoggerConfig {
    let baseConfig: GenerateLoggerConfig
    if (typeof moduleNameOrConfig === 'string') {
      baseConfig = {
        moduleNames: [moduleNameOrConfig],
      } as GenerateLoggerConfig
    } else if (moduleNameOrConfig instanceof Array) {
      baseConfig = {
        moduleNames: moduleNameOrConfig,
      } as GenerateLoggerConfig
    } else {
      baseConfig = moduleNameOrConfig
    }

    return baseConfig
  }

  private buildLoggerOptions(moduleNameOrConfig: GenerateLoggerConfig | string | string[]): winston.LoggerOptions {
    const baseConfig = this.buildConfig(moduleNameOrConfig)
    const name = this.getLoggerName(baseConfig.moduleNames)
    const config: GenerateLoggerConfig = {
      ...baseConfig,
      logFile: baseConfig.logFile || this.defaultLogFile,
      transports: baseConfig.transports || this.baseTransports,
      logLevel: this.getLogLevel(baseConfig, name),
    }

    return {
      defaultMeta: {
        label: name,
      },
      level: config.logLevel,
      format: this.getFormats(),
      transports: this.getTransports(config, name),
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

    for (const transportConfig of config.transports) {
      transports.push(transportManager.initTransport(transportConfig, this.logPath))
    }

    return transports
  }
}

export * from './enums'
export * from './const'
export * from './types'
export * from './transports'
export * from './tail'

export default logger
