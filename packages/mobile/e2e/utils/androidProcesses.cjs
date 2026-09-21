const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const { androidSdkTool, ANDROID_APP_ID } = require('./androidQssBuild.cjs')

function androidCommands(deviceId, env = process.env, execute = promisify(execFile)) {
  if (!deviceId || deviceId !== env.DETOX_ANDROID_DEVICE_ID) {
    throw new Error('Select the exact owned Android device using DETOX_ANDROID_DEVICE_ID')
  }
  const adb = androidSdkTool('adb', env)
  return async (...args) => {
    const { stdout } = await execute(adb, ['-s', deviceId, ...args], { encoding: 'utf8', timeout: 15000, env })
    return stdout.trim()
  }
}

function parseAndroidProcesses(output) {
  const lines = output.trim().split(/\r?\n/)
  if (lines.shift().trim().split(/\s+/).join(' ') !== 'UID PID PPID STAT NAME') {
    throw new Error('Android must expose the complete numeric process table')
  }
  return lines
    .filter(line => line.trim())
    .map(line => {
      const [uid, pid, parent, state, ...name] = line.trim().split(/\s+/)
      if (![uid, pid, parent].every(value => /^\d+$/.test(value)) || !state || !name.length) {
        throw new Error('Android returned an invalid process identity')
      }
      return { uid: Number(uid), pid: Number(pid), parent: Number(parent), state, name: name.join(' ') }
    })
}

const processes = async adb =>
  parseAndroidProcesses(await adb('shell', 'ps', '-A', '-n', '-o', 'UID,PID,PPID,STAT,NAME'))

async function snapshotAndroidProcesses(adb) {
  const uid = Number(await adb('shell', 'run-as', ANDROID_APP_ID, 'id', '-u'))
  if (!Number.isSafeInteger(uid) || uid < 10000) throw new Error('Expected the owned standard debug app UID')
  const owned = (await processes(adb)).filter(row => row.uid === uid && !row.state.startsWith('Z'))
  if (!owned.some(row => row.name === ANDROID_APP_ID)) throw new Error('The owned Android app is not running')
  // Node runs in the app process. Tor can outlive/reparent away from that
  // process; the app UID includes it and services even after reparenting.
  return { uid, count: owned.length }
}

async function waitForAndroidProcessExit(adb, snapshot, timeout = 20000) {
  const deadline = Date.now() + timeout
  do {
    const alive = (await processes(adb)).filter(row => row.uid === snapshot.uid && !row.state.startsWith('Z'))
    if (!alive.length) return
    if (Date.now() >= deadline) throw new Error(`${alive.length} owned Android app/backend/Tor processes remain online`)
    await new Promise(resolve => setTimeout(resolve, 250))
  } while (true)
}

function parseAndroidStoppedState(output, uid) {
  const user = Math.floor(uid / 100000)
  const row = output.split(/\r?\n/).find(line =>
    new RegExp(`^\\s*User ${user}:\\s`).test(line) && /\bstopped=(true|false)\b/.test(line)
  )
  if (!row || !/\binstalled=true\b/.test(row)) throw new Error('Android package inspection must identify the installed owned app and user')
  return /\bstopped=true\b/.test(row)
}

async function androidOfflineState(adb, snapshot) {
  const alive = (await processes(adb)).filter(row => row.uid === snapshot.uid && !row.state.startsWith('Z'))
  const stopped = parseAndroidStoppedState(await adb('shell', 'dumpsys', 'package', ANDROID_APP_ID), snapshot.uid)
  return { alive, stopped }
}

async function assertAndroidStopped(adb, snapshot) {
  const { alive, stopped } = await androidOfflineState(adb, snapshot)
  // Do not wait for a revived app to exit: it may already have received the
  // supposedly offline message. Android clears stopped when the app restarts.
  if (alive.length || !stopped) throw new Error('The owned Android app restarted during its required offline interval')
}

async function cancelAndroidJobs(adb, snapshot) {
  await adb('shell', 'cmd', 'jobscheduler', 'cancel', '--user', String(Math.floor(snapshot.uid / 100000)), ANDROID_APP_ID)
}

async function forceStopAndroidApp(adb, snapshot, { timeout = 20000, stableFor = 1500, pollInterval = 100 } = {}) {
  await adb('shell', 'am', 'force-stop', '--user', String(Math.floor(snapshot.uid / 100000)), ANDROID_APP_ID)
  const deadline = Date.now() + timeout
  let stoppedSince
  do {
    const { alive, stopped } = await androidOfflineState(adb, snapshot)
    if (!alive.length && stopped) {
      stoppedSince ??= Date.now()
      if (Date.now() - stoppedSince >= stableFor) return
    } else {
      stoppedSince = undefined
    }
    if (Date.now() >= deadline) throw new Error('Android must remain force-stopped with no app/backend/Tor processes')
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  } while (true)
}

async function verifyAndroidRouting(adb) {
  await adb('reverse', 'tcp:3003', 'tcp:3003')
  const routes = (await adb('reverse', '--list')).split(/\r?\n/).map(line => line.trim().split(/\s+/))
  if (!routes.some(parts => parts.length === 3 && parts[1] === 'tcp:3003' && parts[2] === 'tcp:3003')) {
    throw new Error('Android must reverse localhost:3003 to the owned host QSS fixture')
  }
}

module.exports = {
  androidCommands,
  parseAndroidProcesses,
  snapshotAndroidProcesses,
  waitForAndroidProcessExit,
  parseAndroidStoppedState,
  assertAndroidStopped,
  cancelAndroidJobs,
  forceStopAndroidApp,
  verifyAndroidRouting,
}
