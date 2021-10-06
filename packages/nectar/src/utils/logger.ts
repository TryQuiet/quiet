import debug from 'debug'

const logger = (module: string) => {
  return Object.assign(debug(`nectar:${module}`), {
    error: debug(`nectar:${module}:err`),
    success: debug(`nectar:${module}:success`)
  })
}

export default logger
