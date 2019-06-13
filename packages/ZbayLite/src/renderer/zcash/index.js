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
      url: envVarOr('http://localhost:8334', 'ZBAY_NODE_URL'),
      auth: {
        username: envVarOr('zbay', 'ZBAY_NODE_USERNAME'),
        password: envVarOr('zbay', 'ZBAY_NODE_PASSWORD')
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
