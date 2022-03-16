import debug from 'debug'
import log from 'electron-log'

export const saveToFileLogger = (packageName: string) => (module: string) => {
  console.log('initializing logger for ', packageName, module, log.transports.file.getFile().path)
  Object.assign(console, log.functions);
  const appInstanceDir = process.env.DATA_DIR ? `${process.env.DATA_DIR}|` : ''
  return Object.assign(log.scope(`${appInstanceDir}${packageName}:${module}`).log, log.functions, {})
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
