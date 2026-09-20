import { jest } from '@jest/globals'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import getPort from 'get-port'
import { setTimeout as sleep } from 'timers/promises'
import { Tor } from './tor.service'
import { TorControl } from './tor-control.service'
import { HiddenServiceData, TorControlAuthType } from './tor.types'
import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { torBinForPlatform, torDirForPlatform } from '../common/utils'

jest.setTimeout(15_000)

describe('onion identities and registration with offline Tor', () => {
  let torProcess: ChildProcessWithoutNullStreams
  let directory: string
  let control: TorControl
  let tor: Tor
  let service: HiddenServiceData
  const password = 'b5e447c10b0d99e7871636ee5e0839b5'
  const until = async (predicate: () => boolean) => {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (predicate()) return
      await sleep(50)
    }
    throw new Error('Offline Tor registration did not settle')
  }

  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-offline-onion-'))
    const port = await getPort()
    torProcess = spawn(
      torBinForPlatform(),
      [
        '--DataDirectory',
        directory,
        '--ControlPort',
        String(port),
        '--SocksPort',
        '0',
        '--CookieAuthentication',
        '1',
        '--DisableNetwork',
        '1',
        '--HashedControlPassword',
        '16:FCFFE21F3D9138906021FAADD9E49703CC41848A95F829E0F6E1BDBE63',
      ],
      { env: { ...process.env, LD_LIBRARY_PATH: torDirForPlatform() } }
    )
    await new Promise<void>((resolve, reject) => {
      let output = ''
      torProcess.once('error', reject)
      torProcess.once('exit', code => reject(new Error(`Tor exited (${code}): ${output}`)))
      torProcess.stdout.on('data', data => {
        output += data.toString()
        if (output.includes('Opened Control listener')) resolve()
      })
    })
    const config = { options: {}, env: {}, torControlPort: port } as ConfigOptions
    control = new TorControl(
      { port, host: '127.0.0.1', auth: { type: TorControlAuthType.PASSWORD, value: password } },
      config
    )
    tor = new Tor(
      config,
      directory,
      { torPath: '', options: { env: { HOME: directory, LD_LIBRARY_PATH: undefined }, detached: false } },
      { torPassword: '', torHashedPassword: '' },
      { io: { emit: jest.fn() } } as unknown as ServerIoProviderTypes,
      control
    )
    // Let the publisher register with Tor while its actual network stays disabled.
    tor.bootstrapped = true
  })

  beforeEach(async () => {
    const identity = await tor.createOnionIdentity()
    tor.bootstrapped = true
    service = {
      onionAddress: identity.onionAddress.replace('.onion', ''),
      privKey: identity.privateKey,
      targetPort: 4343,
      virtPort: 80,
    }
  })

  afterEach(async () => {
    tor.resetHiddenServices()
    jest.restoreAllMocks()
    for (const onion of await control.getDetachedOnionServices()) await control.sendCommand(`DEL_ONION ${onion}`)
  })

  afterAll(async () => {
    await tor?.onModuleDestroy()
    control?.onModuleDestroy()
    if (torProcess && torProcess.exitCode == null) {
      const exited = new Promise<void>(resolve => torProcess.once('exit', () => resolve()))
      torProcess.kill('SIGTERM')
      await exited
    }
    fs.rmSync(directory, { force: true, recursive: true })
  })

  it('generates distinct identities at bootstrap 0 and immediately reuses their keys without collisions', async () => {
    tor.bootstrapped = false
    const identities = new Set<string>()
    for (let attempt = 0; attempt < 10; attempt++) {
      const identity = await tor.createOnionIdentity()
      expect(identity.onionAddress).toMatch(/^[a-z2-7]{56}\.onion$/)
      expect(Buffer.from(identity.privateKey.split(':')[1], 'base64')).toHaveLength(64)
      identities.add(identity.onionAddress)
      // No polling, sleeps, or retries between generating and reusing the key.
      const accepted = await control.sendCommand(`ADD_ONION ${identity.privateKey} Flags=Detach Port=80,127.0.0.1:4343`)
      expect(accepted.messages).toContain(`250-ServiceID=${identity.onionAddress.replace('.onion', '')}`)
    }
    expect(identities.size).toBe(10)
    const bootstrap = await control.sendCommand('GETINFO status/bootstrap-phase')
    expect(bootstrap.messages.join('\n')).toMatch(/PROGRESS=0\b/)
    expect(tor['hiddenServices'].size).toBe(0)
    expect(tor['publishedHiddenServices'].size).toBe(0)
  })

  it('releases a temporary identity even when its command reply is lost', async () => {
    const original = control._sendCommand.bind(control)
    let privateKey!: string
    let serviceId!: string
    jest.spyOn(control, '_sendCommand').mockImplementationOnce(async (command, signal) => {
      const response = await original(command, signal)
      privateKey = response.messages.find(line => line.startsWith('250-PrivateKey='))!.slice(15)
      serviceId = response.messages.find(line => line.startsWith('250-ServiceID='))!.slice(14)
      throw new Error('Simulated lost key-generation reply')
    })
    await expect(tor.createOnionIdentity()).rejects.toThrow('Simulated lost key-generation reply')
    const accepted = await control.sendCommand(`ADD_ONION ${privateKey} Flags=Detach Port=80,127.0.0.1:4343`)
    expect(accepted.messages).toContain(`250-ServiceID=${serviceId}`)
  })

  it('waits for native cookie credentials but never waits for network bootstrap or publication', async () => {
    tor.bootstrapped = false
    control.updateConnectionParams({
      ...control.torControlParams,
      auth: { type: TorControlAuthType.COOKIE, value: '' },
    })
    let finished = false
    const identity = tor.createOnionIdentity().then(result => {
      finished = true
      return result
    })
    try {
      await sleep(50)
      expect(finished).toBe(false)
      expect(control.connection).toBeNull()
    } finally {
      tor.rewireNativeTor({
        controlPort: control.torControlParams.port,
        httpTunnelPort: 0,
        authCookie: fs.readFileSync(path.join(directory, 'control_auth_cookie')).toString('hex'),
      })
    }
    try {
      expect((await identity).onionAddress).toMatch(/^[a-z2-7]{56}\.onion$/)
      expect(tor.bootstrapped).toBe(false)
      expect(tor['publishedHiddenServices'].size).toBe(0)
      expect(await control.getDetachedOnionServices()).toEqual(new Set())
    } finally {
      tor['stopBootstrapWatcher']()
    }
  })

  it('still registers an existing app-generated identity without changing its address', async () => {
    // Captured from the previous generator with the RFC 8032 test-vector seed.
    // Existing persisted identities must remain usable after switching generators.
    const accepted = await control.sendCommand(
      'ADD_ONION ED25519-V3:MHyDhk8oM8tCei7xwAoBPP3/J2jZgMCjpSDwBpBN6U+bTwr+KAt0aneGhOdUQlAgV7dHOgPwj5b1o46Sh+Afjw== Flags=Detach Port=80,127.0.0.1:4343'
    )
    expect(accepted.messages).toContain('250-ServiceID=25njqamcweflpvkl73j4szahhihoc4xt3ktcgjnpaingr5yhkenl5sid')
  })

  it('reuses a Tor-generated key and reports the exact same onion address', async () => {
    await tor.registerHiddenService(service)
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    expect(await control.getDetachedOnionServices()).toEqual(new Set([service.onionAddress]))
    expect(tor['publishedHiddenServices'].size).toBe(0)
  })

  it('recovers an accepted ADD whose response was lost', async () => {
    const original = control.sendCommand.bind(control)
    let loseReply = true
    const commands = jest.spyOn(control, 'sendCommand').mockImplementation(async (command, signal) => {
      const response = await original(command, signal)
      if (command.startsWith('ADD_ONION') && loseReply) {
        loseReply = false
        throw new Error('Simulated lost ADD_ONION response')
      }
      return response
    })
    await tor.registerHiddenService(service)
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    expect(commands.mock.calls.filter(([command]) => command.startsWith('ADD_ONION'))).toHaveLength(2)
    expect(commands.mock.calls.filter(([command]) => command.startsWith('DEL_ONION'))).toHaveLength(1)
    expect(await control.getDetachedOnionServices()).toEqual(new Set([service.onionAddress]))
  })

  it('rebinds a detached orphan instead of producing the 550 collision from older versions', async () => {
    await control.sendCommand(`ADD_ONION ${service.privKey} Flags=Detach Port=80,127.0.0.1:9999`)
    const commands = jest.spyOn(control, 'sendCommand')
    await tor.registerHiddenService(service)
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    expect(commands).toHaveBeenCalledWith(`DEL_ONION ${service.onionAddress}`, expect.any(AbortSignal))
    expect(commands).toHaveBeenCalledWith(
      `ADD_ONION ${service.privKey} Flags=Detach Port=80,127.0.0.1:4343`,
      expect.any(AbortSignal)
    )
  })

  it('keeps the existing service after its publication observer disconnects', async () => {
    const commands = jest.spyOn(control, 'sendCommand')
    const registrations = jest.spyOn(tor as any, 'ensureHiddenServiceRegistered')
    await tor.registerHiddenService(service)
    await until(() => tor['registeredHiddenServices'].has(service.onionAddress))
    for (const socket of control['eventConnections']) socket.destroy()
    await until(() => commands.mock.calls.filter(([command]) => command === 'GETINFO onions/detached').length === 2)
    await registrations.mock.results[1].value
    expect(commands.mock.calls.filter(([command]) => command.startsWith('ADD_ONION'))).toHaveLength(1)
    expect(commands.mock.calls.filter(([command]) => command.startsWith('DEL_ONION'))).toHaveLength(0)
    expect(await control.getDetachedOnionServices()).toEqual(new Set([service.onionAddress]))
  })
})
