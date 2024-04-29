import debug from 'debug'
import { Console } from 'console'
import { DateTime } from 'luxon'

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
    // @ts-ignore
    nodeConsoleLogger[level](text, ...optionalParams)
    if (this.parallelConsoleLog) {
      // @ts-ignore
      console[level](text, ...optionalParams)
    }
  }

  private formatMessage(message: any, level: string): string {
    const messageText = typeof message === 'string' ? message : JSON.stringify(message, null, 2)
    return `${DateTime.utc().toISO()} ${level.toUpperCase()} ${this.name} ${messageText}`
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
