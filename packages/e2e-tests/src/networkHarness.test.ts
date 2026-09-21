import childProcess, { execFileSync, spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { NetworkHarness, type NetworkPlayer, verifyBandwidth } from './networkHarness'

const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const suite = process.env.QUIET_NETWORK_HARNESS === 'true' ? describe : describe.skip
const runner = path.resolve(__dirname, '../lib/network/runNetworkTests.js')

function expectRemoved(players: NetworkPlayer[], forwarding: string): void {
  const namespaces = execFileSync('ip', ['netns', 'list'], { encoding: 'utf8' })
  const rules = execFileSync('sudo', ['-n', 'iptables-save'], { encoding: 'utf8' })
  const links = execFileSync('ip', ['-j', 'link'], { encoding: 'utf8' })
  for (const player of players) {
    expect(namespaces).not.toContain(player.namespace)
    expect(rules).not.toContain(player.namespace.replace(/-\d+$/, ''))
    expect(links).not.toContain(player.dataHost)
    expect(links).not.toContain(player.controlDevice)
    expect(fs.existsSync(`/etc/netns/${player.namespace}`)).toBe(false)
  }
  expect(fs.readFileSync('/proc/sys/net/ipv4/ip_forward', 'utf8')).toBe(forwarding)
}

function expectStopped(pid: number): void {
  const stat = `/proc/${pid}/stat`
  // A reparented child may briefly remain a zombie until init reaps it.
  expect(!fs.existsSync(stat) || fs.readFileSync(stat, 'utf8').split(' ')[2] === 'Z').toBe(true)
}

suite('Linux network harness (real kernel interfaces and processes)', () => {
  it('waits for slow-starting bandwidth servers before measuring real TCP traffic', async () => {
    const network = new NetworkHarness()
    const forwarding = fs.readFileSync('/proc/sys/net/ipv4/ip_forward', 'utf8')
    const realSpawn = childProcess.spawn
    const delayedServer = jest.spyOn(childProcess, 'spawn').mockImplementation((command, args = [], options = {}) => {
      if (command === 'sudo' && args?.includes('iperf3') && args.includes('-s')) {
        const index = args.indexOf('iperf3')
        return realSpawn(
          command,
          [...args.slice(0, index), 'sh', '-c', 'sleep 1; exec iperf3 "$@"', 'iperf3', ...args.slice(index + 1)],
          options
        )
      }
      return realSpawn(command, args, options)
    })
    try {
      await verifyBandwidth(network.setup())
    } finally {
      delayedServer.mockRestore()
      network.close()
    }
    expectRemoved(network.players, forwarding)
  }, 120_000)

  it('limits both directions independently, leaves WebDriver/other player fast, and restores speed', async () => {
    const network = new NetworkHarness()
    const forwarding = fs.readFileSync('/proc/sys/net/ipv4/ip_forward', 'utf8')
    try {
      await verifyBandwidth(network.setup())
    } finally {
      network.close()
    }
    expectRemoved(network.players, forwarding)
  }, 120_000)

  it('restores forwarding after setup failure without deleting an existing namespace', () => {
    const network = new NetworkHarness()
    const existing = `${network.tag}-0`
    const forwarding = fs.readFileSync('/proc/sys/net/ipv4/ip_forward', 'utf8')
    execFileSync('sudo', ['-n', 'ip', 'netns', 'add', existing])
    try {
      try {
        expect(() => network.setup()).toThrow()
      } finally {
        network.close()
      }
      expect(execFileSync('ip', ['netns', 'list'], { encoding: 'utf8' })).toContain(existing)
      expect(fs.readFileSync('/proc/sys/net/ipv4/ip_forward', 'utf8')).toBe(forwarding)
    } finally {
      execFileSync('sudo', ['-n', 'ip', 'netns', 'del', existing])
    }
  })

  it.each([null, 'SIGTERM', 'SIGINT'] as const)(
    'preserves failure/cancellation (%s), kills descendants, and removes its network',
    async signal => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-network-lifecycle-'))
      const marker = path.join(directory, 'ready.json')
      const forwarding = fs.readFileSync('/proc/sys/net/ipv4/ip_forward', 'utf8')
      const command = `
        const fs = require('fs');
        const descendant = require('child_process').spawn(process.execPath,
          ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
        fs.writeFileSync(${JSON.stringify(marker + '.tmp')}, JSON.stringify({
          players: JSON.parse(process.env.QUIET_NETWORK_PLAYERS), pid: process.pid, descendant: descendant.pid,
        }));
        fs.renameSync(${JSON.stringify(marker + '.tmp')}, ${JSON.stringify(marker)});
        ${signal ? 'setInterval(() => {}, 1000);' : 'process.exit(23);'}
      `
      // Skip bandwidth measurement only; exercise the production supervisor/setup/cleanup.
      const bootstrap = `require(${JSON.stringify(runner)}).runWithNetwork(
        ${JSON.stringify([process.execPath, '-e', command])}, false
      ).then(code => { process.exitCode = code; }).catch(error => { console.error(error); process.exitCode = 1; });`
      const child = spawn(process.execPath, ['-e', bootstrap], { env: { ...process.env, QUIET_NETWORK_QSS: 'false' } })
      let output = ''
      child.stdout.on('data', data => {
        output += data
      })
      child.stderr.on('data', data => {
        output += data
      })
      const exited = new Promise<number | null>((resolve, reject) => {
        child.once('error', reject)
        child.once('exit', resolve)
      })
      try {
        const deadline = Date.now() + 20_000
        while (!fs.existsSync(marker) && child.exitCode === null && Date.now() < deadline) await sleep(50)
        if (!fs.existsSync(marker)) throw new Error(`Test command never started: ${output}`)
        const payload = JSON.parse(fs.readFileSync(marker, 'utf8'))
        if (signal) child.kill(signal)
        const code = await Promise.race([exited, sleep(15_000).then(() => 'timed out')])
        expect({ code, output }).toEqual({ code: signal ? 130 : 23, output: '' })
        expectStopped(payload.pid)
        expectStopped(payload.descendant)
        expectRemoved(payload.players, forwarding)
      } finally {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill('SIGTERM')
          await exited
        }
        fs.rmdirSync(directory, { recursive: true })
      }
    },
    40_000
  )
})
