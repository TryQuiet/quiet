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

// Singleton instance for winston logger
let _winstonLogger: Logger | undefined = undefined

const initWinstonLogger = (): Logger | undefined => {
  if (_winstonLogger) return _winstonLogger
  // Add a non-colorized format for file logs
  const formats: winston.Logform.Format[] = [
    format.splat(),
    format.timestamp(),
    format.errors(),
    format.printf(info => info.message as string),
  ]
  if (process.env.COLORIZE_LOG_FILES !== 'true') {
    // Remove ANSI color codes
    formats.push(format.uncolorize())
  }
  const fileFormat = format.combine(...formats)
  const logDir = process.env.LOG_DIR
  const logToFile = (process.env.LOG_TO_FILE ?? 'true') === 'true'
  if (logToFile && logDir != null) {
    _winstonLogger = winston.createLogger({
      level: 'silly', // this is just because we are doing the log level checking via debug
      transports: [
        new transports.DailyRotateFile({
          // %DATE will be replaced by the current date
          filename: path.join(logDir, `error_%DATE%.log`),
          level: 'error',
          format: fileFormat, // Use non-colorized format for file
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false, // don't want to zip our logs
          maxFiles: '3d', // will keep log until they are older than 7 days
        }),
        // same for all levels
        new transports.DailyRotateFile({
          filename: path.join(logDir, `log_%DATE%.log`),
          format: fileFormat, // Use non-colorized format for file
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxFiles: '3d',
        }),
      ],
    })
    return _winstonLogger
  }
  return undefined
}

/**
 * Generate a function that creates a module-level logger with a name like `packageName:moduleName`.  This is the main
 * entry point for logging in node environments (e.g. desktop and backend).
 *
 * @param name This is the name that will be printed in the log entry
 * @param parallelConsoleLog If true we will also log to the native console (e.g. browser console)
 * @param formatters Optional configuration of string formatter functions to apply (this allows for including format strings like `%s` in log messages)
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
    internalLogMethod = (
      level: LogLevel,
      parallelConsoleLog: boolean,
      minifyTraceLogs: boolean,
      ...formattedLogStrings: string[]
    ): void => {
      if (winstonLogger != null) {
        const winstonLevel = level === LogLevel.ERROR ? LogLevel.ERROR : LogLevel.INFO
        winstonLogger.log(winstonLevel, formattedLogStrings.join(' '))
      }
      DEFAULT_INTERNAL_LOG_METHOD(level, parallelConsoleLog, minifyTraceLogs, ...formattedLogStrings)
    }
  }
  return createQuietLogger(internalLogMethod, packageName, parallelConsoleLog, formatters)
}
