'use strict'
const test = require('node:test')
const path = require('node:path')
const {createRequire} = require('node:module')
require('./sodium-native.checks.cjs').register(test, async () => {
  const fromLfa = createRequire(path.resolve(__dirname, '../../..', '3rd-party/auth/packages/crypto/package.json'))
  return fromLfa('libsodium-wrappers-sumo')
})
