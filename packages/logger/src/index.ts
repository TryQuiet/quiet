import debug from 'debug'

export const consoleLogger = (packageName: string) => (module: string) => {
  debug('quiet')('Initializing debug logger')
  const logger = Object.assign(debug(`${packageName}:${module}`), {
    error: debug(`${packageName}:${module}:err`)
  })
  return logger
}

export const logger = (packageName: string) => {
  return consoleLogger(packageName)
}

export default logger
