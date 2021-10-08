import debug from 'debug'

const logPrefix = 'waggle'

const logger = (module: string) => {
  return Object.assign(debug(`${logPrefix}:${module}`), {
    error: debug(`${logPrefix}:${module}:err`),
    success: debug(`${logPrefix}:${module}:success`)
  })
}

export default logger
