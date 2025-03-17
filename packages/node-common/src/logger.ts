// @ts-ignore
import winston, { transports, Logger, format } from 'winston'
import 'winston-daily-rotate-file'

import path from 'path'
import {
  QuietLogger,
  __nodeConsoleLogger,
  InternalLogMethod,
  LogLevel,
  createQuietLogger,
  DEFAULT_INTERNAL_LOG_METHOD,
  LogFormatters,
} from '@quiet/logger'

const initWinstonLogger = (): Logger => {
  const baseFormat = format.combine(
    format.splat(),
    format.timestamp(),
    format.errors(),
    format.printf(info => info.message as string)
  )
  const winstonTransports: winston.transport[] = [
    new transports.Console({
      format: format.combine(format.cli({ all: true }), baseFormat),
    }),
  ]
  const logDir = process.env.LOG_DIR
  const logToFile = (process.env.LOG_TO_FILE ?? 'true') === 'true'
  if (logToFile && logDir != null) {
    winstonTransports.push(
      new transports.DailyRotateFile({
        // %DATE will be replaced by the current date
        filename: path.join(logDir, `error_%DATE%.log`),
        level: 'error',
        format: baseFormat,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false, // don't want to zip our logs
        maxFiles: '3d', // will keep log until they are older than 7 days
      }),
      // same for all levels
      new transports.DailyRotateFile({
        filename: path.join(logDir, `log_%DATE%.log`),
        format: baseFormat,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxFiles: '3d',
      })
    )
  }

  return winston.createLogger({
    level: 'silly', // this is just because we are doing the log level checking via debug
    transports: winstonTransports,
  })
}

/**
 * Generate a function that creates a module-level logger with a name like `packageName:moduleName`.  This is the main
 * entry point for logging in Quiet.
 *
 * @param packageName Name of the package we are logging in
 * @param parallelConsoleLog If true we will also log to the native console (e.g. browser console)
 * @returns A function that can be used to generate a module-level logger
 */
export const createWinstonQuietLogger = (
  packageName: string,
  parallelConsoleLog: boolean = false,
  formatters?: LogFormatters
): ((moduleName?: string) => QuietLogger) => {
  const winstonLogger = initWinstonLogger()
  let internalLogMethod: InternalLogMethod = DEFAULT_INTERNAL_LOG_METHOD
  const logToFile = (process.env.LOG_TO_FILE ?? 'true') === 'true'
  if (logToFile) {
    internalLogMethod = (level: LogLevel, ...formattedLogStrings: string[]): void => {
      const winstonLevel = level === LogLevel.ERROR ? LogLevel.ERROR : LogLevel.INFO
      winstonLogger.log(winstonLevel, formattedLogStrings.join(' '))
    }
  }
  return createQuietLogger(internalLogMethod, packageName, parallelConsoleLog, formatters)
}
