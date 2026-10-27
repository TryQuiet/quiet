import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { CHECKED_LOCKFILES, findViolations, isPatched } from './check-runtime-dependency-floors.mjs'

const lock = packages => ({ lockfileVersion: 3, packages })

test('ws is patched per major line', () => {
  for (const version of ['6.2.4', '6.2.6', '7.5.11', '7.5.13', '8.21.0', '8.22.0', '9.0.0']) {
    assert.equal(isPatched('ws', version), true, version)
  }
  for (const version of ['5.2.4', '6.2.3', '7.5.10', '8.17.1', '8.18.3', '8.20.0', '8.21.0-beta.1']) {
    assert.equal(isPatched('ws', version), false, version)
  }
})

test('socket.io-parser needs 4.2.7', () => {
  assert.equal(isPatched('socket.io-parser', '4.2.7'), true)
  assert.equal(isPatched('socket.io-parser', '4.3.0'), true)
  assert.equal(isPatched('socket.io-parser', '4.2.6'), false)
  assert.equal(isPatched('socket.io-parser', '4.2.4'), false)
  assert.equal(isPatched('socket.io-parser', '3.4.3'), false)
})

test('flags vulnerable runtime copies, including nested ones, and ignores dev-only copies', () => {
  const violations = findViolations(
    lock({
      '': { name: 'x' },
      'node_modules/ws': { version: '8.18.3' },
      'node_modules/socket.io/node_modules/ws': { version: '8.17.1' },
      'node_modules/socket.io-client/node_modules/socket.io-parser': { version: '4.2.4' },
      'node_modules/storybook/node_modules/ws': { version: '8.11.0', dev: true },
      'node_modules/other': { version: '1.0.0' },
    })
  )
  assert.deepEqual(
    violations.map(v => `${v.name}@${v.version}`),
    ['ws@8.18.3', 'ws@8.17.1', 'socket.io-parser@4.2.4']
  )
})

test('a devOptional copy still counts as runtime', () => {
  assert.equal(findViolations(lock({ 'node_modules/ws': { version: '8.17.1', devOptional: true } })).length, 1)
})

test('a lockfile without a packages section is an error, not a pass', () => {
  assert.throws(() => findViolations({ lockfileVersion: 1, dependencies: {} }))
})

test('the shipped lockfiles resolve no vulnerable runtime ws or socket.io-parser', async () => {
  for (const path of CHECKED_LOCKFILES) {
    const lockfile = JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))
    assert.deepEqual(findViolations(lockfile, path), [])
  }
})
