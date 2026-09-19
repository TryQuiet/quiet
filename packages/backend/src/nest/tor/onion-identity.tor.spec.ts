import { jest } from '@jest/globals'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import getPort from 'get-port'
import { setTimeout as sleep } from 'timers/promises'
import { createOnionIdentity } from './onion-identity'
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

  beforeEach(() => {
    const identity = createOnionIdentity()
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

  it('accepts a locally generated expanded key and reports the exact derived onion address', async () => {
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
