import debug from 'debug'
import { Console } from 'console'
import { DateTime } from 'luxon'

const colors = require('ansi-colors')

/**
 * Available log levels
 */
enum LogLevel {
  DEBUG = 'debug',
  ERROR = 'error',
  INFO = 'info',
  LOG = 'log',
  WARN = 'warn',
}

/**
 * This determines the color scheme of each log type
 */
colors.theme({
  // debug
  debug: colors.bold.cyan,
  debug_text: colors.cyan,

  // log
  log: colors.bold.gray,
  log_text: colors.gray,

  // info
  info: colors.bold.blue,
  info_text: colors.blue,

  // warn
  warn: colors.bold.yellow,
  warn_text: colors.yellow,

  // error
  error: colors.bold.redBright,
  error_text: colors.redBright,

  // misc
  scope: colors.magenta,
  date: colors.bold.gray,
  object: colors.green,
  object_error: colors.red,
})

/**
 * This is the base logger we use to write to the node terminal.  Due to the ways that we import the node logger
 * we have to account for that (hence the ternary statement).
 */
const nodeConsoleLogger = Console instanceof Function ? new Console(process.stdout, process.stderr) : console

/**
 * This class is what we use to log to the node console and, optionally, the native console for browser-facing code
 * like the desktop renderer
 *
 * NOTE: This is exported because it needs to be exposed for the logger to work but you should use `createQuietLogger` in
 * (probably) all contexts
 */
export class QuietLogger {
  // This is based on the `debug` package and is backwards-compatible with the old logger's behavior (for the most part)
  private isDebug: boolean

  /**
   *
   * @param name This is the name that will be printed in the log entry
   * @param parallelConsoleLog If true we will also log to the native console (e.g. browser console)
   */
  constructor(
    public name: string,
    public parallelConsoleLog: boolean = false
  ) {
    this.isDebug = debug.enabled(name)
  }

  /*
  Log Level Methods
  */

  /**
   * Log a debug-level message if the DEBUG environment variable is set for this package/module
   *
   * @param message Message to log
   * @param optionalParams Optional parameters to log
   */
  debug(message: any, ...optionalParams: any[]) {
    if (!this.isDebug) return

    this.callLogMethods(LogLevel.DEBUG, message, ...optionalParams)
  }

  /**
   * Log an error-level message
   *
   * @param message Message to log
   * @param optionalParams Optional parameters to log
   */
  error(message: any, ...optionalParams: any[]) {
    this.callLogMethods(LogLevel.ERROR, message, ...optionalParams)
  }

  /**
   * Log an info-level message
   *
   * @param message Message to log
   * @param optionalParams Optional parameters to log
   */
  info(message: any, ...optionalParams: any[]) {
    this.callLogMethods(LogLevel.INFO, message, ...optionalParams)
  }

  /**
   * Log a log-level message if the DEBUG environment variable is set for this package/module
   *
   * @param message Message to log
   * @param optionalParams Optional parameters to log
   */
  log(message: any, ...optionalParams: any[]) {
    if (!this.isDebug) return

    this.callLogMethods(LogLevel.LOG, message, ...optionalParams)
  }

  /**
   * Log a warn-level message
   *
   * @param message Message to log
   * @param optionalParams Optional parameters to log
   */
  warn(message: any, ...optionalParams: any[]) {
    this.callLogMethods(LogLevel.WARN, message, ...optionalParams)
  }

  /**
   * Formats the message and writes it out to the node logger and, optionally, to the native console with
   * colorized text and parameters
   *
   * NOTE: The text and optional parameter are printed in different colors for clarity when reading a given log
   * line
   *
   * @param level The level we are logging at
   * @param message The main log message
   * @param optionalParams Other parameters we want to log
   */
  private callLogMethods(level: LogLevel, message: any, ...optionalParams: any[]): void {
    const formattedMessage = this.formatMessage(message, level)
    const colorizedOptionalParams = optionalParams.map((param: any) => this.formatObject(param))
    // @ts-ignore
    nodeConsoleLogger[level](formattedMessage, ...colorizedOptionalParams)
    if (this.parallelConsoleLog) {
      // @ts-ignore
      console[level](formattedMessage, ...colorizedOptionalParams)
    }
  }

  /**
   * Formats the primary log message and applies the level-specific coloring
   *
   * @param message Primary message to log
   * @param level The level we are logging at
   * @returns A colorized log string
   */
  private formatMessage(message: any, level: string): string {
    const colorizedLevel = colors[level](level.toUpperCase())
    const colorizedScope = colors['scope'](this.name)
    const colorizedDate = colors['date'](DateTime.utc().toISO())
    const colorizedMessageText =
      typeof message === 'string' ? colors[`${level}_text`](message) : this.formatObject(message)
    return `${colorizedDate} ${colorizedLevel} ${colorizedScope} ${colorizedMessageText}`
  }

  /**
   * Colorizes an object parameter based on its type.
   *   - Errors are printed in red and we attempt to log the full stacktrace
   *   - Objects are stringified and logged
   *   - All other types are logged as-is
   *
   * @param param Object to format
   * @returns Colorized object
   */
  private formatObject(param: any): string {
    if (param instanceof Error) {
      return colors['object_error'](param.stack || `${param.name}: ${param.message}`)
    } else if (['string', 'number', 'boolean', 'bigint'].includes(typeof param)) {
      return colors['object'](param)
    }
    return colors['object'](JSON.stringify(param, null, 2))
  }
}

/**
 * Generate a function that creates a module-level logger with a name like `packageName:moduleName`.  This is the main
 * entry point for logging in Quiet.
 *
 * @param packageName Name of the package we are logging in
 * @param parallelConsoleLog If true we will also log to the native console (e.g. browser console)
 * @returns A function that can be used to generate a module-level logger
 */
export const createQuietLogger = (
  packageName: string,
  parallelConsoleLog: boolean = false
): ((moduleName: string) => QuietLogger) => {
  return (moduleName: string) => {
    const name = `${packageName}:${moduleName}`
    nodeConsoleLogger.info(`Initializing logger ${name}`)
    return new QuietLogger(name, parallelConsoleLog)
  }
}
