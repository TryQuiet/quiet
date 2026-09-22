import { execFileSync, spawn } from 'child_process'
import { once } from 'events'
import fs from 'fs'
import net from 'net'
import os from 'os'
import path from 'path'
import {
  namespaceCommand,
  stopNamespaceProcesses,
  waitForNamespaceTorProcess,
  type NetworkNamespace,
} from './networkNamespace'

const suite = process.env.QUIET_NETWORK_PLAYERS ? describe : describe.skip
suite('Linux namespace process launch', () => {
  it('runs as the caller, preserves app configuration, and isolates the network', () => {
    const network: NetworkNamespace = JSON.parse(process.env.QUIET_NETWORK_PLAYERS!)[0]
    const command = namespaceCommand(network, process.execPath, [
      '-e',
      `
      console.log(JSON.stringify({
        uid: process.getuid(), home: process.env.HOME, marker: process.env.QUIET_TEST_MARKER,
        network: require('fs').readlinkSync('/proc/self/ns/net'),
      }))
    `,
    ])
    const child = JSON.parse(
      execFileSync(command.command, command.args, {
        encoding: 'utf8',
        input: JSON.stringify({ ...process.env, QUIET_TEST_MARKER: 'spaces and $literal values' }),
      })
    )
    expect(child.uid).toBe(process.getuid!())
    expect(child.home).toBe(process.env.HOME)
    expect(child.marker).toBe('spaces and $literal values')
    expect(child.network).not.toBe(fs.readlinkSync('/proc/self/ns/net'))
    const expected = execFileSync(
      'sudo',
      ['-n', 'ip', 'netns', 'exec', network.namespace, 'readlink', '/proc/self/ns/net'],
      { encoding: 'utf8' }
    ).trim()
    expect(child.network).toBe(expected)
  })

  const qssTest = process.env.QUIET_NETWORK_QSS === 'true' ? it : it.skip
  qssTest(
    'both players reach the Docker QSS endpoint through the shaped data link',
    () => {
      const networks: NetworkNamespace[] = JSON.parse(process.env.QUIET_NETWORK_PLAYERS!)
      const gateway = networks[0].gateway
      for (const network of networks) {
        const route = JSON.parse(
          execFileSync('sudo', ['-n', 'ip', '-n', network.namespace, '-j', 'route', 'get', gateway], {
            encoding: 'utf8',
          })
        )
        expect(route[0].dev).toBe('data0')
        const command = namespaceCommand(network, process.execPath, [
          '-e',
          `
        const request = require('http').get({
          hostname: '${gateway}', port: 3003, path: '/socket.io/?EIO=4&transport=websocket',
          headers: { Connection: 'Upgrade', Upgrade: 'websocket',
            'Sec-WebSocket-Version': '13', 'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==' },
        });
        request.on('upgrade', (res, socket) => {
          console.log(JSON.stringify({status: res.statusCode, upgrade: res.headers.upgrade}));
          socket.destroy();
        });
        request.on('response', res => { console.error('Upgrade rejected:', res.statusCode); process.exit(1); });
        request.on('error', error => { console.error(error); process.exit(1); });
        `,
        ])
        const response = JSON.parse(
          execFileSync(command.command, command.args, {
            encoding: 'utf8',
            input: JSON.stringify(process.env),
            timeout: 10_000,
          })
        )
        expect(response.status).toBe(101)
        expect(response.upgrade).toBe('websocket')
      }
    },
    30_000
  )

  qssTest('blocks non-QSS data traffic even when the destination service is listening', async () => {
    const networks: NetworkNamespace[] = JSON.parse(process.env.QUIET_NETWORK_PLAYERS!)
    const server = net.createServer(socket => socket.end())
    await new Promise<void>(resolve => server.listen(0, '0.0.0.0', resolve))
    try {
      const port = (server.address() as net.AddressInfo).port
      // Prove this is a live service, rather than mistaking an unused port for isolation.
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect(port, networks[0].gateway, () => {
          socket.destroy()
          resolve()
        })
        socket.on('error', reject)
      })
      for (const network of networks) {
        const command = namespaceCommand(network, process.execPath, [
          '-e',
          `
          const socket = require('net').connect(${port}, '${networks[0].gateway}');
          socket.on('connect', () => { console.log('CONNECTED'); socket.destroy(); });
          socket.on('error', error => console.log(error.code));
          `,
        ])
        const result = execFileSync(command.command, command.args, {
          encoding: 'utf8',
          input: JSON.stringify(process.env),
          timeout: 5000,
        })
        expect(result.trim()).toBe('ECONNREFUSED')
      }
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()))
    }
  })

  it('observes a real Tor daemon in the correct namespace without backend startup logs', async () => {
    const networks: NetworkNamespace[] = JSON.parse(process.env.QUIET_NETWORK_PLAYERS!)
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet network tor '))
    const quietDirectory = path.join(directory, 'Quiet')
    const pidFile = path.join(quietDirectory, 'torPid.json')
    const torDirectory = path.join(quietDirectory, 'TorDataDirectory')
    fs.mkdirSync(quietDirectory)
    // Existing files alone do not establish that this profile has a Tor daemon.
    await expect(waitForNamespaceTorProcess(networks[0], directory, 200)).rejects.toThrow('No Tor process')
    fs.writeFileSync(pidFile, String(process.pid))
    await expect(waitForNamespaceTorProcess(networks[0], directory, 200)).rejects.toThrow('No Tor process')
    fs.unlinkSync(pidFile)

    const tor = path.resolve(__dirname, '../../../3rd-party/tor/linux/tor')
    const command = namespaceCommand(networks[0], tor, [
      '--SocksPort',
      '0',
      '--DisableNetwork',
      '1',
      '--DataDirectory',
      torDirectory,
      '--PidFile',
      pidFile,
    ])
    const child = spawn(command.command, command.args, { stdio: ['pipe', 'ignore', 'pipe'] })
    const exited = once(child, 'exit')
    child.stderr!.resume()
    child.stdin!.end(JSON.stringify({ ...process.env, LD_LIBRARY_PATH: path.dirname(tor) }))
    let pid: number | undefined
    try {
      pid = await waitForNamespaceTorProcess(networks[0], directory)
      expect(fs.readFileSync(`/proc/${pid}/comm`, 'utf8').trim()).toBe('tor')
      await expect(waitForNamespaceTorProcess(networks[1], directory, 200)).rejects.toThrow('No Tor process')
      const otherDirectory = `${directory}-other`
      fs.mkdirSync(path.join(otherDirectory, 'Quiet'), { recursive: true })
      try {
        fs.writeFileSync(path.join(otherDirectory, 'Quiet', 'torPid.json'), String(pid))
        await expect(waitForNamespaceTorProcess(networks[0], otherDirectory, 200)).rejects.toThrow('No Tor process')
      } finally {
        fs.rmdirSync(otherDirectory, { recursive: true })
      }
    } finally {
      // Stop only the daemon launched for this temporary profile, even if discovery failed.
      if (fs.existsSync(pidFile)) {
        const ownedPid = Number(fs.readFileSync(pidFile, 'utf8').trim())
        try {
          const args = fs.readFileSync(`/proc/${ownedPid}/cmdline`, 'utf8').split('\0')
          if (args.includes(torDirectory)) process.kill(ownedPid, 'SIGTERM')
        } catch (error) {
          expect(['ENOENT', 'ESRCH']).toContain(error.code)
        }
      }
      await exited
      if (pid) {
        fs.writeFileSync(pidFile, String(pid))
        await expect(waitForNamespaceTorProcess(networks[0], directory, 200)).rejects.toThrow('No Tor process')
      }
      fs.rmdirSync(directory, { recursive: true })
    }
  }, 30_000)

  it('terminates leftover namespace children without terminating the test runner', async () => {
    const network: NetworkNamespace = JSON.parse(process.env.QUIET_NETWORK_PLAYERS!)[0]
    const command = namespaceCommand(network, process.execPath, [
      '-e',
      `
      const child = require('child_process').spawn(process.execPath,
        ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
      console.log(child.pid);
      child.unref();
    `,
    ])
    const pid = Number(
      execFileSync(command.command, command.args, { encoding: 'utf8', input: JSON.stringify(process.env) }).trim()
    )
    expect(fs.existsSync(`/proc/${pid}`)).toBe(true)
    stopNamespaceProcesses(network)
    // A reparented child can briefly remain a zombie until init reaps it.
    await new Promise(resolve => setTimeout(resolve, 200))
    const stat = fs.existsSync(`/proc/${pid}/stat`) ? fs.readFileSync(`/proc/${pid}/stat`, 'utf8') : ''
    expect(stat === '' || stat.split(' ')[2] === 'Z').toBe(true)
    expect(fs.existsSync(`/proc/${process.pid}`)).toBe(true)
  })
})
