import debug from 'debug'
import { Console } from 'console'
import { DateTime } from 'luxon'

import { ANY_KEY, findAllByKeyAndReplace } from './utils'

const colors = require('ansi-colors')

const COLORIZE = process.env['COLORIZE'] === 'true'

export type InternalLogMethod = (
  level: LogLevel,
  parallelConsoleLog: boolean,
  minifyTraceLogs: boolean,
  ...formattedLogStrings: string[]
) => void

/**
 * Available log levels
 */
export enum LogLevel {
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  ERROR = 'error',
  INFO = 'info',
  LOG = 'log',
  TRACE = 'trace',
  WARN = 'warn',
  TIMER = 'timer',
}

/**
 * Maximum log level allowed
 */
export enum LogSetting {
  MINIFIED_TRACE = 4, // Allows all logs but writes TRACE logs without stacktraces
  TRACE = 3, // Allows all logs
  VERBOSE = 2, // Allow VERBOSE logs but not TRACE
  DEBUG = 1, // Excludes `trace` logs
  ON = 0, // Excludes `trace`, `debug`, and `log`
}

/**
 * Common fields to colorize
 */
export enum ColorField {
  SCOPE = 'scope',
  STATIC_LOG_ID = 'staticLogId',
  DATE = 'date',
  OBJECT = 'object',
  OBJECT_ERROR = 'object_error',
}

export type CallableQuietLogger = {
  (message: any, ...optionalParams: any[]): void
  error(formatter: string, ...args: any[]): void
  trace(formatter: any, ...args: any[]): void
  enabled: boolean
  LOGGER: QuietLogger
}

export type LogFormatters = { [char: string]: (value?: any) => string }
type FormattedMessage = { formatted: string; params: any[] }

/**
 * This determines the color scheme of each log type
 */
colors.theme({
  // trace
  trace: colors.bold.italic.cyanBright,
  trace_text: colors.italic.cyanBright,

  // trace
  verbose: colors.bold.italic.dim.white,
  verbose_text: colors.italic.dim.white,

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

  // timers
  timer: colors.bold.yellowBright,
  timer_text: colors.yellowBright,

  // misc
  scope: colors.magenta,
  scope_trace: colors.italic.magenta,
  scope_verbose: colors.italic.dim.magenta,
  staticLogId: colors.bold.white,
  staticLogId_trace: colors.bold.italic.white,
  staticLogId_verbose: colors.bold.italic.dim.white,
  date: colors.bold.gray,
  date_trace: colors.bold.italic.gray,
  date_verbose: colors.bold.italic.dim.gray,
  object: colors.green,
  object_trace: colors.italic.green,
  object_verbose: colors.italic.dim.green,
  object_error: colors.red,
  object_error_trace: colors.italic.red,
  object_error_verbose: colors.italic.dim.red,
})

/**
 * This is the base logger we use to write to the node terminal.  Due to the ways that we import the node logger
 * we have to account for that (hence the ternary statement).
 */
export const __nodeConsoleLogger = Console instanceof Function ? new Console(process.stdout, process.stderr) : console

/**
 * This class is what we use to log in the Quiet app
 *
 * NOTE: This is exported because it needs to be exposed for the logger to work but you should use `createQuietLogger` in
 * (probably) all contexts
 */
export class QuietLogger {
  // This is based on the `debug` package and is backwards-compatible with the old logger's behavior (for the most part)
  public readonly logSetting: LogSetting = LogSetting.ON
  // Tracks timers created by the `time` log method
  private readonly timers: Map<string, number> = new Map()
  // Static, traceable ID that is attached to all logs from a given instance of Quiet
  private readonly staticLogId: string | undefined
  // If true minify trace logs by removing stacktraces
  private readonly minifyTraceLogs: boolean

  /**
   * @param internalLogMethod This is what determines how and where logs are written
   * @param name This is the name that will be printed in the log entry
   * @param parallelConsoleLog If true we will also log to the native console (e.g. browser console)
   * @param formatters Optional configuration of string formatter functions to apply (this allows for including format strings like `%s` in log messages)
   */
  constructor(
    private readonly internalLogMethod: InternalLogMethod,
    public name: string,
    public parallelConsoleLog: boolean = false,
    private formatters?: LogFormatters
  ) {
    this.logSetting = this._getLogSetting()
    this.staticLogId = process.env.STATIC_LOG_ID
    this.minifyTraceLogs = process.env.MINIFY_TRACE_LOGS === 'true'
  }

  extend(moduleName: string): QuietLogger {
    return new QuietLogger(
      this.internalLogMethod,
      `${this.name}:${moduleName}`,
      this.parallelConsoleLog,
      this.formatters
    )
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
    this.callLogMethods(LogLevel.DEBUG, message, ...optionalParams)
  }

  /**
   * Log a trace-level message if the DEBUG environment variable is set for this package/module with
   * trace (e.g. `backend*:trace`) set
   *
   * @param message Message to log
   * @param optionalParams Optional parameters to log
   */
  trace(message: any, ...optionalParams: any[]) {
    this.callLogMethods(LogLevel.TRACE, message, ...optionalParams)
  }

  /**
   * Log a verbose-level message if the DEBUG environment variable is set for this package/module with
   * trace (e.g. `backend*:trace`) or verbose (e.g. `backend*:verbose`) set
   *
   * @param message Message to log
   * @param optionalParams Optional parameters to log
   */
  verbose(message: any, ...optionalParams: any[]) {
    this.callLogMethods(LogLevel.VERBOSE, message, ...optionalParams)
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
   * Start a timer with a given name
   *
   * @param name Name of the timer
   */
  time(name: string) {
    if (this.timers.has(name)) {
      this.warn(`Timer with name ${name} already exists!`)
      return
    }

    const formattedLogStrings = this.formatLog(LogLevel.TIMER, name, `- timer started`)
    this.internalLogMethod(LogLevel.LOG, this.parallelConsoleLog, this.minifyTraceLogs, formattedLogStrings.join(' '))

    const startMs = DateTime.utc().toMillis()
    this.timers.set(name, startMs)
  }

  /**
   * Calculate the runtime of the timer with a given name and log the formatted timing message
   *
   * @param name Name of the timer
   */
  timeEnd(name: string) {
    if (!this.timers.has(name)) {
      this.warn(`No timer started with name ${name}!`)
      return
    }

    const endMs = DateTime.utc().toMillis()
    const startMs = this.timers.get(name)!
    this.timers.delete(name)

    const formattedLogStrings = this.formatLog(LogLevel.TIMER, name, `${endMs - startMs}ms - timer ended`)
    this.internalLogMethod(LogLevel.LOG, this.parallelConsoleLog, this.minifyTraceLogs, formattedLogStrings.join(' '))
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
    if (!this._canLog(level)) return

    const formattedLogStrings = this.formatLog(level, message, ...optionalParams)
    this.internalLogMethod(level, this.parallelConsoleLog, this.minifyTraceLogs, formattedLogStrings.join(' '))
  }

  /**
   * Format the message and optional parameters according to the formatting rules for a given log level
   *
   * @param level The level we are logging at
   * @param message The main log message
   * @param optionalParams Other parameters we want to log
   * @returns Array of formatted log strings
   */
  private formatLog(level: LogLevel, message: any, ...optionalParams: any[]): string[] {
    const { formatted: formattedMessage, params } = this.formatMessage(message, level, ...optionalParams)
    const formattedOptionalParams = params.map((param: any) => this.formatObject(param, level))
    return [formattedMessage, ...formattedOptionalParams]
  }

  /**
   * Formats the primary log message and applies the level-specific coloring
   *
   * @param message Primary message to log
   * @param level The level we are logging at
   * @returns A colorized log string
   */
  private formatMessage(message: any, level: LogLevel, ...optionalParams: any[]): FormattedMessage {
    let formattedLevel = level.toUpperCase()
    let scope = this.name
    let staticId = this.staticLogId
    let date = DateTime.utc().toISO()
    const { formatted, params } = this.formatMessageText(message, level, ...optionalParams)

    if (COLORIZE) {
      formattedLevel = colors[level](formattedLevel)
      scope = this._getColorForField(ColorField.SCOPE, level)(scope)
      date = this._getColorForField(ColorField.DATE, level)(date)
      staticId = staticId != null ? this._getColorForField(ColorField.STATIC_LOG_ID, level)(staticId) : undefined
    }

    return {
      formatted: `${date} ${formattedLevel} ${staticId != null ? `${staticId} ${scope}` : scope} ${formatted}`,
      params,
    }
  }

  /**
   * Formats the primary log message string and applies the level-specific text coloring
   *
   * @param message Primary message to log
   * @param level The level we are logging at
   * @returns A colorized log message string
   */
  private formatMessageText(message: any, level: LogLevel, ...optionalParams: any[]): FormattedMessage {
    if (['string', 'number', 'boolean', 'bigint'].includes(typeof message)) {
      let formatted = message
      let params: any[] = optionalParams
      if (typeof message === 'string') {
        const withFormatters = this.applyFormatters(formatted, ...optionalParams)
        formatted = withFormatters.formatted
        params = withFormatters.params
      }
      if (COLORIZE) {
        formatted = colors[`${level}_text`](formatted)
      }
      return {
        formatted,
        params,
      }
    }

    // we override the object coloring to be the same as normal level-specific text
    return {
      formatted: this.formatObject(message, level),
      params: optionalParams,
    }
  }

  // stolen from the debug package and retooled
  private applyFormatters(message: string, ...optionalParams: any[]): FormattedMessage {
    if (this.formatters == null) {
      return {
        formatted: message,
        params: optionalParams,
      }
    }

    let index = 0
    const formatted = message.replace(/%([a-zA-Z%])/g, (match, format) => {
      // If we encounter an escaped % then don't increase the array index
      if (match === '%%') {
        return '%'
      }
      if (index > 0) index++
      const formatter = this.formatters![format]
      if (formatter != null && typeof formatter === 'function') {
        const val = optionalParams[index]
        match = formatter(val)
        // Now we need to remove `args[index]` since it's inlined in the `format`
        optionalParams.splice(index, 1)
        if (index > 0) index--
      }
      return match
    })

    return {
      formatted,
      params: optionalParams,
    }
  }

  /**
   * Colorizes an object parameter based on its type.
   *   - Errors are printed in red and we attempt to log the full stacktrace
   *   - Objects are stringified and logged
   *   - All other types are logged as-is
   *
   * @param param Object to format
   * @param level The level we are logging at
   * @param overrideColorKey Color field we would like to use instead
   * @returns Colorized string
   */
  private formatObject(param: any, level: LogLevel, overrideColorKey: string | undefined = undefined): string {
    if (param instanceof Error) {
      const colorizeError = (stringifiedError: string): string => {
        //@ts-ignore
        return COLORIZE
          ? this._getColorForField(ColorField.OBJECT_ERROR, level, overrideColorKey)(stringifiedError)
          : stringifiedError
      }

      const stringifyError = (err: Error) => {
        return err.stack || `${err.name}: ${err.message}`
      }

      let formattedErrors: string = stringifyError(param)
      if ((param as any).errors != null) {
        formattedErrors += ` - Errors:\n`
        formattedErrors += (param as any).errors.map((err: Error) => stringifyError(err)).join('\n')
      } else if ((param as any).originalError != null) {
        formattedErrors += ` - Original Error:\n`
        formattedErrors += stringifyError((param as any).originalError)
      }

      return colorizeError(formattedErrors)
    }

    const colorize = (stringifiedParam: string): string => {
      //@ts-ignore
      return COLORIZE
        ? this._getColorForField(ColorField.OBJECT, level, overrideColorKey)(stringifiedParam)
        : stringifiedParam
    }

    let formatted: string
    if (['string', 'number', 'boolean', 'bigint'].includes(typeof param)) {
      formatted = param
    } else if (param == null) {
      formatted = 'undefined'
    } else {
      try {
        let truncatedOrNot: string
        if ((param as ArrayLike<any>).length != undefined) {
          truncatedOrNot = param
        } else {
          truncatedOrNot = this.truncateMessageForLogging(param)
        }
        formatted = JSON.stringify(truncatedOrNot, null, 2)
      } catch (e) {
        formatted = param.toString()
        if (formatted.startsWith('[object')) {
          formatted = param
        }
      }
    }

    return colorize(formatted)
  }

  /**
   * Truncate fields on an object to produce smaller, more readable logs
   *
   * @param obj Object to truncate text in
   * @returns Truncated object
   */
  private truncateMessageForLogging(obj: any): string {
    return findAllByKeyAndReplace(obj, [
      {
        key: ANY_KEY,
        replace: {
          replacerFunc: (value: any) => {
            if (value != null && typeof value === 'bigint') {
              return (value as bigint).toString()
            } else if (value != null && (value.toV1 != null || value.toV0 != null)) {
              return value.toString()
            } else if (value != null && value instanceof Uint8Array) {
              return Buffer.from(value).toString('base64')
            }

            return value
          },
        },
      },
    ])
  }

  /**
   * Checks if this logger is enabled in `debug` and to what level
   *
   * NOTE: if a valid value is provided for the env variable `GLOBAL_LOG_LEVEL` and the applied
   * LogSetting value is greater than the value that would be generated by checking settings in `debug`
   * the global override will supercede it.  However, if the value is less than the value generated by
   * checking settings in `debug` the higher value from the `DEBUG` env variable would win.  The applied
   * value of `GLOBAL_LOG_LEVEL` sets the minimum log level.
   *
   * WARNING: If you need to skip specific namespaces don't use GLOBAL_LOG_LEVEL as it will override those skips!
   *
   * Examples:
   *
   *  - `DEBUG=backend*:* GLOBAL_LOG_LEVEL=trace` => Allow trace logs for all of our loggers
   *  - `DEBUG=backend*:trace GLOBAL_LOG_LEVEL=debug` => Allow debug logs for all of our loggers, allow trace for backend
   *
   * @returns LogSetting for this logger
   */
  private _getLogSetting(): LogSetting {
    const globalLogSettingOverride = this._applyGlobalLogLevel()
    if (globalLogSettingOverride >= LogSetting.TRACE || this._canTrace()) {
      if (this.minifyTraceLogs) return LogSetting.MINIFIED_TRACE
      return LogSetting.TRACE
    } else if (globalLogSettingOverride >= LogSetting.VERBOSE || this._canVerbose()) {
      return LogSetting.VERBOSE
    } else if (globalLogSettingOverride >= LogSetting.DEBUG || this._canDebug()) {
      return LogSetting.DEBUG
    }

    return LogSetting.ON
  }

  /**
   * Check if <this logger name>:trace is explicitly enabled in the DEBUG environment variable
   *
   * @returns True if this logger can emit TRACE logs
   */
  private _canTrace(): boolean {
    const traceNamespace = `${this.name}:trace`
    return debug.enabled(traceNamespace)
  }

  /**
   * Check if <this logger name>:verbose or <this logger name>:verbose is explicitly enabled in the DEBUG environment variable
   *
   * @returns True if this logger can emit VERBOSE logs
   */
  private _canVerbose(): boolean {
    const verboseNamespace = `${this.name}:verbose`
    if (debug.enabled(verboseNamespace)) return true
    return this._canTrace()
  }

  /**
   * Check if this namespace is enabled in the DEBUG environment variable
   *
   * @returns True if this logger can emit DEBUG logs
   */
  private _canDebug(): boolean {
    return debug.enabled(this.name)
  }

  /**
   * Checks the intended log level against the log setting to determine if we are allowed to log
   *
   * @param level The level we are logging at
   * @returns True if the intended log level is allowed on this logger
   */
  private _canLog(level: LogLevel): boolean {
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.LOG:
        return this.logSetting >= LogSetting.DEBUG
      case LogLevel.TRACE:
        return this.logSetting >= LogSetting.TRACE
      case LogLevel.VERBOSE:
        return this.logSetting >= LogSetting.VERBOSE
      case LogLevel.INFO:
      case LogLevel.WARN:
      case LogLevel.ERROR:
      case LogLevel.TIMER:
      default:
        return true
    }
  }

  /**
   * Gets the correct ansi-color value for a given field and log level.  Color is determined by:
   *  1. Which field we are logging
   *  2. If the level is `trace` we use trace-specific field values
   *  3. If there is an override
   *
   * @param field Field we are getting a color for
   * @param level The level we are logging at
   * @param overrideColorKey Color field we would like to use instead
   * @returns ansi-color value for the given field
   */
  private _getColorForField(field: ColorField, level: LogLevel, overrideColorKey?: string): any {
    if (overrideColorKey) {
      return colors[overrideColorKey]
    }

    if (level === LogLevel.TRACE) {
      return colors[`${field}_trace`]
    }

    if (level === LogLevel.VERBOSE) {
      return colors[`${field}_verbose`]
    }

    return colors[field]
  }

  /**
   * Determine the global override LogSetting based on the human readable log level provided in GLOBAL_LOG_LEVEL, if that level is
   * one of:
   *
   *  - trace
   *  - verbose
   *  - debug
   *
   * @returns The LogSetting that matches the value of GLOBAL_LOG_LEVEL
   */
  private _applyGlobalLogLevel(): LogSetting {
    const envGlobalLogLevel = process.env.GLOBAL_LOG_LEVEL
    if (envGlobalLogLevel == null) return LogSetting.ON
    switch (envGlobalLogLevel) {
      case LogLevel.TRACE:
        return LogSetting.TRACE
      case LogLevel.VERBOSE:
        return LogSetting.VERBOSE
      case LogLevel.DEBUG:
        return LogSetting.DEBUG
      default:
        return LogSetting.ON
    }
  }
}

/**
 * Default method for logging that writes logs to the node console
 *
 * @param level Level to log at
 * @param parallelConsoleLog Simultaneously write logs to the browser console
 * @param minifyTraceLogs If true print trace logs without stacktraces
 * @param formattedLogStrings List of pre-formatted log strings to write to the log entry
 */
export const DEFAULT_INTERNAL_LOG_METHOD: InternalLogMethod = (
  level,
  parallelConsoleLog: boolean,
  minifyTraceLogs: boolean,
  ...formattedLogStrings
): void => {
  let printLevel: LogLevel = level
  let overrideLevel: LogLevel = level
  if (level === LogLevel.TRACE && !minifyTraceLogs) {
    // we have to do this conversion because console doesn't have a trace method
    printLevel = LogLevel.LOG
  } else if (level === LogLevel.VERBOSE || (level === LogLevel.TRACE && minifyTraceLogs)) {
    // we have to do this conversion to stop stack traces from being written on minified trace logs
    printLevel = LogLevel.INFO
    overrideLevel = LogLevel.DEBUG
  }

  // @ts-ignore
  __nodeConsoleLogger[overrideLevel](...formattedLogStrings)
  if (parallelConsoleLog) {
    // @ts-ignore
    console[printLevel](...formattedLogStrings)
  }
}

/**
 * Generate a function that creates a module-level logger with a name like `packageName:moduleName`.  This is the main
 * entry point for logging in Quiet.
 *
 * @param internalLogMethod This is what determines how and where logs are written
 * @param name This is the name that will be printed in the log entry
 * @param formatters Optional configuration of string formatter functions to apply (this allows for including format strings like `%s` in log messages)
 * @returns A function that can be used to generate a module-level logger
 */
export const createQuietLogger = (
  internalLogMethod: InternalLogMethod,
  packageName: string,
  parallelConsoleLog: boolean = false,
  formatters?: LogFormatters
): ((moduleName?: string) => QuietLogger) => {
  return (moduleName?: string) => {
    let name: string
    if (moduleName == null) {
      name = packageName
    } else {
      name = `${packageName}:${moduleName}`
    }
    return new QuietLogger(internalLogMethod, name, parallelConsoleLog, formatters)
  }
}
