import { remote } from 'electron'
import * as R from 'ramda'
import crypto from 'crypto'

import electronStore from '../../shared/electronStore'
import Zcash from './client'

const envVarOr = (defaultValue, envVar) =>
  R.propOr(defaultValue, envVar)(remote.getGlobal('process').env)

let _client = null
let _username = null
export const credentials = () => {
  const isDev = process.env.NODE_ENV === 'development'
  const username = electronStore.get('username')
  if (isDev || !username) {
    return {
      username: 'zbay',
      password: 'zbay'
    }
  } else {
    return {
      username: username,
      password: electronStore.get('password')
    }
  }
}
export const createClient = () => {
  const rpcCredentials = credentials()
  if (R.isNil(_client) || _username !== rpcCredentials.username) {
    _client = new Zcash({
      url: envVarOr('http://localhost:8334', 'ZBAY_NODE_URL'),
      auth: rpcCredentials
    })
    _username = rpcCredentials.username
  }
  return _client
}
export const createRpcCredentials = () =>
  new Promise((resolve, reject) => {
    const nonceUsername = Math.random().toString()
    const noncePassword = Math.random().toString()
    const password = crypto.createHash('sha256')
    const username = crypto.createHash('sha256')
    password.update(noncePassword)
    username.update(nonceUsername)
    electronStore.set('username', username.digest('hex'))
    electronStore.set('password', password.digest('hex'))
    resolve()
  })
export const getClient = () => {
  const rpcCredentials = credentials()
  if (R.isNil(_client) || _username !== rpcCredentials.username) {
    createClient()
  }
  return _client
}

export default {
  getClient
}
