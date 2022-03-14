import debug from 'debug'
import log from 'electron-log'

export const saveToFileLogger = (packageName: string) => (module: string) => {
  console.log('SAVE TO FILE LOGGER', packageName, module)
  Object.assign(console, log.functions);
  return Object.assign(log.scope(`${packageName}:${module}`).log, log.functions, {})
}

export const consoleLogger = (packageName: string) => (module: string) => {
  console.log('CONSOLE LOGGER', packageName, module)
  return Object.assign(debug(`${packageName}:${module}`), {
    error: debug(`${packageName}:${module}:err`)
  })
}

const logger = (packageName: string) => {
  console.log('LOGGER MAIN', packageName, process.env.NODE_ENV, process.env.REACT_APP_ENABLE_SENTRY)
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_ENABLE_SENTRY === 'true') {
    // if (process.env.SAVE_LOGS) {
    return saveToFileLogger(packageName)
  }
  return consoleLogger(packageName)
}

// console.log('WHAT IS logger in logger?:', logger)

// export {logger as handleLogger}
// const logger = (name) => {
//   console.log('THIS IS LOGGER', name)
// }
// const nectarLogger = logger('nectar')

// const nectarLogger = Object.assign(debug(`${'nectar'}:${module}`), {
//   error: debug(`${'nectar'}:${module}:err`)
// })

// export { nectarLogger }

export default logger
