import axios from 'axios'
import * as R from 'ramda'

const getAuth = (config) => {
  const auth = config.auth
  const invalidConfig = R.anyPass([
    R.propSatisfies(R.isNil, 'username'),
    R.propSatisfies(R.isNil, 'password')
  ])
  if (config.auth && invalidConfig(auth)) {
    console.warn('Incorrect auth configuration for Zcash node client, skipping authentication.')
    return {}
  }
  return auth
}

export default function JRPC (opts = {}) {
  const config = {
    url: 'http://localhost:8332',
    ...opts
  }

  return new Proxy({}, {
    get (target, method) {
      if (typeof target[method] === 'function') {
        return target[method]
      }

      return async (...params) => {
        const requestData = {
          jsonrpc: '2.0',
          method,
          params,
          id: Date.now()
        }

        const authConfig = getAuth(config)
        const requestConfig = R.mergeAll([
          R.isEmpty(authConfig) ? {} : { auth: authConfig },
          { 'WWW-Authenticate': 'Basic realm=\'jsonrpc\'' },
          opts.timeout ? { timeout: opts.timeout } : {}
        ])
        const { data } = await axios.post(config.url, requestData, requestConfig)

        if (data.error) {
          throw new Error(`${data.error.code}: ${data.error.message}`)
        }
        return data.result
      }
    }
  })
}
