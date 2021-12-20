import debug from 'debug'

const resultLogger = () => {
  const module = 'test'
  return Object.assign(debug(`nectar:${module}`), {
    failed: debug(`nectar:${module}:failed`),
    passed: debug(`nectar:${module}:passed`)
  })
}

export default resultLogger
