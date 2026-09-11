const test = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const { once } = require('node:events')
const { snapshotOwnedProcesses, waitForProcessExit } = require('../e2e/utils/desktopProcesses.cjs')

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
