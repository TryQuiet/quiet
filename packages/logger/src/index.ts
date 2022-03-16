import debug from 'debug'
import path from 'path'
import log from 'electron-log'

export const saveToFileLogger = (packageName: string) => (module: string) => {
  const appInstanceDir = process.env.DATA_DIR || ''
  log.transports.file.resolvePath = (variables) => {
    return path.join(variables.appData, appInstanceDir, variables.appName, 'logs', variables.fileName)
  }
  log.info('Logs path:', log.transports.file.getFile().path)
  Object.assign(console, log.functions);
  return Object.assign(log.scope(`${packageName}:${module}`).log, log.functions, {})
}

export const consoleLogger = (packageName: string) => (module: string) => {
  debug('quietLogger')('Initializing debug logger')
  const logger = Object.assign(debug(`${packageName}:${module}`), {
    error: debug(`${packageName}:${module}:err`)
  })
  return logger
}

const logger = (packageName: string) => {
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_ENABLE_SENTRY === 'true') {
    return saveToFileLogger(packageName)
  }
  return consoleLogger(packageName)
}

export default logger
