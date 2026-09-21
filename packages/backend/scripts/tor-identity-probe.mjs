// Bundle with build-tor-probe.mjs, then run in a supported Node/Electron/mobile
// runtime with the path to that platform's Tor executable as the first argument.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import getPort from 'get-port'
import { Tor } from '../src/nest/tor/tor.service.ts'
import { TorControl } from '../src/nest/tor/tor-control.service.ts'
import { TorControlAuthType } from '../src/nest/tor/tor.types.ts'

async function main() {
  assert(process.argv[2], 'Pass the path to the platform Tor executable')
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-tor-probe-'))
  const port = await getPort()
  const daemon = spawn(path.resolve(process.argv[2]), [
    '--DataDirectory',
    directory,
    '--ControlPort',
    String(port),
    '--SocksPort',
    '0',
    '--DisableNetwork',
    '1',
    '--CookieAuthentication',
    '1',
  ])
  const config = { options: {}, env: {}, torControlPort: port }
  const control = new TorControl(
    {
      host: '127.0.0.1',
      port,
      auth: { type: TorControlAuthType.COOKIE, value: '' },
    },
    config
  )
  const tor = new Tor(
    config,
    directory,
    { torPath: '', options: { env: { HOME: directory }, detached: false } },
    { torPassword: '', torHashedPassword: '' },
    { io: { emit() {} } },
    control
  )
  const deadline = setTimeout(() => {
    console.error('FAIL: offline Tor identity probe timed out')
    daemon.kill('SIGTERM')
    process.exit(1)
  }, 20_000)
  try {
    await new Promise((resolve, reject) => {
      let output = ''
      daemon.once('error', reject)
      daemon.once('exit', code => reject(new Error(`Tor exited before readiness (${code})`)))
      daemon.stdout.on('data', data => {
        output += data.toString()
        if (output.includes('Opened Control listener')) resolve()
      })
      daemon.stderr.resume()
    })
    let completed = false
    const pending = tor.createOnionIdentity().then(identity => {
      completed = true
      return identity
    })
    await sleep(50)
    assert.equal(completed, false, 'Identity must wait for local credentials')
    tor.rewireNativeTor({
      controlPort: port,
      httpTunnelPort: 0,
      authCookie: fs.readFileSync(path.join(directory, 'control_auth_cookie')).toString('hex'),
    })
    const first = await pending
    fs.writeFileSync(path.join(directory, 'identity.json'), JSON.stringify(first), { mode: 0o600 })
    const restored = JSON.parse(fs.readFileSync(path.join(directory, 'identity.json'), 'utf8'))
    const second = await tor.createOnionIdentity()
    assert.notEqual(first.onionAddress, second.onionAddress)
    for (const identity of [restored, second]) {
      assert.match(identity.onionAddress, /^[a-z2-7]{56}\.onion$/)
      assert.equal(Buffer.from(identity.privateKey.split(':')[1], 'base64').length, 64)
      assert.equal((await control.getDetachedOnionServices()).size, 0)
      const response = await control.sendCommand(`ADD_ONION ${identity.privateKey} Flags=Detach Port=80,127.0.0.1:4343`)
      const serviceId = identity.onionAddress.replace('.onion', '')
      assert(response.messages.includes(`250-ServiceID=${serviceId}`))
      await control.sendCommand(`DEL_ONION ${serviceId}`)
    }
    await tor.registerHiddenService({
      onionAddress: restored.onionAddress,
      privKey: restored.privateKey,
      targetPort: 4343,
      virtPort: 80,
    })
    const bootstrap = await control.sendCommand('GETINFO status/bootstrap-phase')
    assert.match(bootstrap.messages.join('\n'), /PROGRESS=0\b/)
    assert.equal(tor.bootstrapped, false)
    assert.equal((await control.getDetachedOnionServices()).size, 0)
    console.log(
      `PASS: ${process.platform}/${process.arch} ${process.version}: native credentials, Tor-generated identities, persistence, immediate reuse and asynchronous registration at bootstrap 0`
    )
  } finally {
    clearTimeout(deadline)
    await tor.onModuleDestroy()
    control.onModuleDestroy()
    if (daemon.pid != null && daemon.exitCode == null && daemon.signalCode == null) {
      const exited = new Promise(resolve => daemon.once('exit', resolve))
      daemon.kill('SIGTERM')
      await exited
    }
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
