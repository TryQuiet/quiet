import debug from 'debug'
import { Console } from 'console'
import { DateTime } from 'luxon'

const colors = require('ansi-colors')

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

export type Logger = debug.Debugger & {
  error: debug.Debugger
}

export const consoleLogger =
  (packageName: string) =>
  (module: string): Logger => {
    debug('quiet')('Initializing debug logger')
    const logger = Object.assign(debug(`${packageName}:${module}`), {
      error: debug(`${packageName}:${module}:err`),
    })
    return logger
  }

export const nodeConsoleLogger = Console instanceof Function ? new Console(process.stdout, process.stderr) : console

export class QuietLogger {
  private isDebug: boolean

  constructor(
    public name: string,
    public parallelConsoleLog: boolean = false
  ) {
    this.isDebug = debug.enabled(name)
  }

  debug(message: any, ...optionalParams: any[]): void {
    if (!this.isDebug) return

    const text = this.formatMessage(message, 'debug')
    this.callLogMethods('debug', text, ...optionalParams)
  }

  error(message: any, ...optionalParams: any[]): void {
    const text = this.formatMessage(message, 'error')
    this.callLogMethods('error', text, ...optionalParams)
  }

  info(message: any, ...optionalParams: any[]): void {
    const text = this.formatMessage(message, 'info')
    this.callLogMethods('info', text, ...optionalParams)
  }

  log(message: any, ...optionalParams: any[]): void {
    if (!this.isDebug) return
    const text = this.formatMessage(message, 'log')
    this.callLogMethods('log', text, ...optionalParams)
  }

  warn(message: any, ...optionalParams: any[]): void {
    const text = this.formatMessage(message, 'warn')
    this.callLogMethods('warn', text, ...optionalParams)
  }

  private callLogMethods(level: string, text: string, ...optionalParams: any[]): void {
    const colorizedOptionalParams = optionalParams.map((param: any) => this.formatObject(param))
    // @ts-ignore
    nodeConsoleLogger[level](text, ...colorizedOptionalParams)
    if (this.parallelConsoleLog) {
      // @ts-ignore
      console[level](text, ...colorizedOptionalParams)
    }
  }

  private formatMessage(message: any, level: string): string {
    const colorizedLevel = colors[level](level.toUpperCase())
    const colorizedScope = colors['scope'](this.name)
    const colorizedDate = colors['date'](DateTime.utc().toISO())
    const colorizedMessageText =
      typeof message === 'string' ? colors[`${level}_text`](message) : this.formatObject(message)
    return `${colorizedDate} ${colorizedLevel} ${colorizedScope} ${colorizedMessageText}`
  }

  private formatObject(param: any): string {
    if (param instanceof Error) {
      return colors['object_error'](param.stack || `${param.name}: ${param.message}`)
    } else if (['string', 'number', 'boolean', 'bigint'].includes(typeof param)) {
      return colors['object'](param)
    }
    return colors['object'](JSON.stringify(param, null, 2))
  }
}

export const electronLogger =
  (packageName: string, parallelConsoleLog: boolean = false) =>
  (module: string): QuietLogger => {
    const name = `${packageName}:${module}`
    nodeConsoleLogger.info(`Initializing logger ${name}`)
    return new QuietLogger(name, parallelConsoleLog)
  }

export const logger = (packageName: string): ((arg: string) => Logger) => {
  return consoleLogger(packageName)
}

export const createQuietLogger = (
  packageName: string,
  parallelConsoleLog: boolean = false
): ((arg: string) => QuietLogger) => {
  return electronLogger(packageName, parallelConsoleLog)
}

export default logger
