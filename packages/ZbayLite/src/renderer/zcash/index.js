import * as R from 'ramda'
import crypto from 'crypto'

import electronStore from '../../shared/electronStore'
import RPC from './client'

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
export const createClient = (options) => {
  const rpcCredentials = credentials()
  if (R.isNil(_client) || _username !== rpcCredentials.username) {
    _client = new RPC()
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
export const getClient = (options) => {
  const rpcCredentials = credentials()
  if (R.isNil(_client) || _username !== rpcCredentials.username) {
    createClient(options)
  }
  return _client
}
export default getClient()
