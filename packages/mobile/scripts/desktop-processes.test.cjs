const test = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const { once } = require('node:events')
const { snapshotOwnedProcesses, waitForProcessExit, stopOwnedProcesses } = require('../e2e/utils/desktopProcesses.cjs')

test('offline evidence includes real descendants and ignores an unrelated client', { timeout: 15000 }, async () => {
  const unrelated = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'])
  const parent = spawn(process.execPath, [
    '-e',
    `
    const {spawn} = require('node:child_process');
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)']);
    process.stdout.write(String(child.pid) + '\\n');
  `,
  ])
  let childPid
  try {
    childPid = Number(String((await once(parent.stdout, 'data'))[0]).trim())
    const snapshot = snapshotOwnedProcesses(parent.pid)
    assert(snapshot.some(row => row.pid === parent.pid))
    assert(snapshot.some(row => row.pid === childPid))
    assert(!snapshot.some(row => row.pid === unrelated.pid))
    await assert.rejects(waitForProcessExit(snapshot, 1), /remain online/)
    process.kill(childPid, 'SIGTERM')
    parent.kill('SIGTERM')
    await waitForProcessExit(snapshot, 5000)
    assert.doesNotThrow(() => process.kill(unrelated.pid, 0))
  } finally {
    parent.kill('SIGTERM')
    unrelated.kill('SIGTERM')
    if (childPid) {
      try {
        process.kill(childPid, 'SIGTERM')
      } catch (error) {
        if (error.code !== 'ESRCH') throw error
      }
    }
  }
})

test('failed desktop cleanup stops captured orphan descendants and leaves other clients alone', { timeout: 15000 }, async () => {
  const unrelated = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'])
  const parent = spawn(process.execPath, ['-e', `
    const child = require('node:child_process').spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)']);
    process.stdout.write(String(child.pid) + '\\n');
  `])
  let snapshot = []
  try {
    const childPid = Number(String((await once(parent.stdout, 'data'))[0]).trim())
    snapshot = snapshotOwnedProcesses(parent.pid)
    assert(snapshot.some(row => row.pid === childPid))
    parent.kill('SIGTERM')
    await once(parent, 'exit')
    await stopOwnedProcesses(snapshot)
    await waitForProcessExit(snapshot, 1000)
    assert.doesNotThrow(() => process.kill(unrelated.pid, 0))
    // A recycled PID with a different birth timestamp must not be signalled.
    const wrongIdentity = snapshotOwnedProcesses(unrelated.pid).map(row => ({ ...row, started: 'different process birth' }))
    await stopOwnedProcesses(wrongIdentity)
    assert.doesNotThrow(() => process.kill(unrelated.pid, 0))
  } finally {
    await stopOwnedProcesses(snapshot)
    parent.kill('SIGTERM')
    unrelated.kill('SIGTERM')
  }
})
