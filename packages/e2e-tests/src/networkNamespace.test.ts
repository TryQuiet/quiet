import { execFileSync } from 'child_process'
import fs from 'fs'
import { namespaceCommand, stopNamespaceProcesses, type NetworkNamespace } from './networkNamespace'

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
