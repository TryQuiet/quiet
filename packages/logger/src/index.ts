import debug from 'debug'

export type Logger = debug.Debugger & {
    error: debug.Debugger;
}

export const consoleLogger = (packageName: string) => (module: string): Logger => {
  debug('quiet')('Initializing debug logger')
  const logger = Object.assign(debug(`${packageName}:${module}`), {
    error: debug(`${packageName}:${module}:err`)
  })
  return logger
}

export const logger = (packageName: string): (arg: string) => Logger => {
  return consoleLogger(packageName)
}

export default logger
