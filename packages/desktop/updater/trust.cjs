const fs = require('node:fs')
const path = require('node:path')
const { parseDn } = require('builder-util-runtime')

function publisherNames(value) {
  const names = typeof value === 'string' ? [value] : value
  if (!Array.isArray(names) || names.length === 0 || names.some(name =>
    typeof name !== 'string' || !name.trim() || !parseDn(name).get('CN') || !parseDn(name).get('O')
  )) throw new Error('An approved full Windows publisher subject (including CN and O) is required')
  return names
}

function subjectsEqual(a, b) {
  // Windows renders the stateOrProvinceName OID as S; OpenSSL uses ST.
  const normalize = subject => {
    const result = parseDn(subject)
    if (result.has('S')) {
      if (result.has('ST') && result.get('S') !== result.get('ST')) throw new Error('Conflicting state attributes in publisher subject')
      result.set('ST', result.get('S'))
      result.delete('S')
    }
    return result
  }
  const left = normalize(a)
  const right = normalize(b)
  return left.size === right.size && [...left].every(([key, value]) => right.get(key) === value)
}

function validateTrust(trust) {
  for (const name of ['metadataBaseUrl', 'targetBaseUrl', 'artifactBaseUrl']) {
    const url = new URL(trust[name])
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.pathname.endsWith('/')) {
      throw new Error(`Update trust requires a fixed HTTPS ${name}`)
    }
  }
  if (!/^[a-z][a-z0-9-]*$/.test(trust.channel)) throw new Error('Invalid update channel')
  return trust
}

function readTrust(resourcesPath) {
  const trust = validateTrust(JSON.parse(fs.readFileSync(path.join(resourcesPath, 'update-trust.json'), 'utf8')))
  trust.rootPath = path.join(resourcesPath, 'update-root.json')
  // Never bootstrap from the update server, even if a cache already exists.
  fs.accessSync(trust.rootPath, fs.constants.R_OK)
  return trust
}

module.exports = { publisherNames, subjectsEqual, readTrust, validateTrust }
