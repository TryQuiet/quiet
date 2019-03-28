import { remote } from 'electron'
import * as R from 'ramda'

import Zcash from './client'

const envVarOr = (defaultValue, envVar) => R.propOr(
  defaultValue,
  envVar
)(remote.getGlobal('process').env)

let _client = null

export const createClient = () => {
  if (R.isNil(_client)) {
    _client = new Zcash({
      url: envVarOr('http://localhost:8332', 'ZBAY_NODE_URL'),
      auth: {
        username: envVarOr('testuser', 'ZBAY_NODE_USERNAME'),
        password: envVarOr('testpassword', 'ZBAY_NODE_PASSWORD')
      }
    })
  }
  return _client
}

export const getClient = () => {
  if (R.isNil(_client)) {
    createClient()
  }
  return _client
}

export default {
  getClient
}
