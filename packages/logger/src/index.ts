import debug from 'debug'
import nodeConsole from 'console'
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

export const nodeConsoleLogger = new nodeConsole.Console(process.stdout, process.stderr)

export class ElectronLogger {
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
    nodeConsoleLogger.debug(text, ...optionalParams)
    if (this.parallelConsoleLog) {
      console.debug(text, ...optionalParams)
    }
  }

  error(message: any, ...optionalParams: any[]): void {
    const text = this.formatMessage(message, 'error')
    nodeConsoleLogger.error(text, ...optionalParams)
    if (this.parallelConsoleLog) {
      console.error(text, ...optionalParams)
    }
  }

  info(message: any, ...optionalParams: any[]): void {
    const text = this.formatMessage(message, 'info')
    nodeConsoleLogger.info(text, ...optionalParams)
    if (this.parallelConsoleLog) {
      console.info(text, ...optionalParams)
    }
  }

  log(message: any, ...optionalParams: any[]): void {
    if (!this.isDebug) return
    const text = this.formatMessage(message, 'log')
    nodeConsoleLogger.log(text, ...optionalParams)
    if (this.parallelConsoleLog) {
      console.log(text, ...optionalParams)
    }
  }

  warn(message: any, ...optionalParams: any[]): void {
    const text = this.formatMessage(message, 'warn')
    nodeConsoleLogger.warn(text, ...optionalParams)
    if (this.parallelConsoleLog) {
      console.warn(text, ...optionalParams)
    }
  }

  private formatMessage(message: any, level: string): string {
    const messageText = typeof message === 'string' ? message : JSON.stringify(message, null, 2)
    return `${DateTime.utc().toISO()} ${level.toUpperCase()} ${this.name} ${messageText}`
  }
}

export const electronLogger =
  (packageName: string, parallelConsoleLog: boolean = false) =>
  (module: string): ElectronLogger => {
    const name = `${packageName}:${module}`
    nodeConsoleLogger.info(`Initializing logger ${name}`)
    return new ElectronLogger(name, parallelConsoleLog)
  }

export const logger = (packageName: string): ((arg: string) => Logger) => {
  return consoleLogger(packageName)
}

export const createElectronLogger = (
  packageName: string,
  parallelConsoleLog: boolean = false
): ((arg: string) => ElectronLogger) => {
  return electronLogger(packageName, parallelConsoleLog)
}

export default logger
