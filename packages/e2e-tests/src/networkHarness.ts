import assert from 'assert'
import { execFile, execFileSync, spawn } from 'child_process'
import fs from 'fs'
import { promisify } from 'util'
import { type NetworkNamespace } from './networkNamespace'

const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface NetworkPlayer extends NetworkNamespace {
  dataHost: string
  dataIP: string
  controlDevice: string
}

const execute = promisify(execFile)
const root = (...args: string[]) =>
  execFileSync('sudo', ['-n', ...args], { encoding: 'utf8', timeout: 60_000, stdio: 'pipe' })
const bestEffort = (...args: string[]) => {
  try {
    return root(...args)
  } catch {
    return ''
  }
}

export function setNetworkSpeed(player: NetworkPlayer, speed: 'slow' | 'fast'): void {
  console.log(`${player.namespace}: ${speed}`)
  // Egress at each end of the data veth controls a different direction.
  for (const [prefix, device, rate] of [
    [[], player.dataHost, '1mbit'],
    [['ip', 'netns', 'exec', player.namespace], 'data0', '256kbit'],
  ] as const) {
    if (speed === 'slow') {
      root(
        ...prefix,
        'tc',
        'qdisc',
        'replace',
        'dev',
        device,
        'root',
        'netem',
        'limit',
        '200',
        'delay',
        '150ms',
        'rate',
        rate
      )
    } else {
      bestEffort(...prefix, 'tc', 'qdisc', 'del', 'dev', device, 'root')
    }
  }
}

function addressRange(cidr: string): [number, number] {
  const [ip, prefix = '32'] = cidr.split('/')
  const address = ip.split('.').reduce((value, octet) => value * 256 + Number(octet), 0)
  const size = 2 ** (32 - Number(prefix))
  const start = Math.floor(address / size) * size
  return [start, start + size - 1]
}

/** Owns only the test namespaces and tagged host rules. The outer runner owns its lifetime. */
export class NetworkHarness {
  readonly tag = `qnet${process.pid}`
  readonly players: NetworkPlayer[] = []
  private readonly rules: Array<{ table: string; chain: string; args: string[] }> = []
  private forwarding?: string

  setup(): NetworkPlayer[] {
    if (process.platform !== 'linux' || process.getuid?.() === 0) {
      throw new Error('Run as a normal Linux user with passwordless sudo')
    }
    const routes: Array<{ dst?: string }> = JSON.parse(
      execFileSync('ip', ['-j', 'route', 'show', 'table', 'all'], { encoding: 'utf8' })
    )
    const occupied = routes
      .filter(({ dst }) => dst && dst !== 'default' && !dst.includes(':'))
      .map(({ dst }) => addressRange(dst!))
    const subnets = Array.from({ length: 220 }, (_, i) => i + 20).filter(n =>
      [203, 204].every(octet => {
        const [start, end] = addressRange(`10.${octet}.${n}.0/30`)
        return occupied.every(([otherStart, otherEnd]) => end < otherStart || start > otherEnd)
      })
    )
    if (subnets.length < 2) throw new Error('No unused test subnets')
    this.forwarding = fs.readFileSync('/proc/sys/net/ipv4/ip_forward', 'utf8').trim()
    root('sysctl', '-q', '-w', 'net.ipv4.ip_forward=1')
    for (const [index, n] of subnets.slice(0, 2).entries()) {
      const player: NetworkPlayer = {
        namespace: `${this.tag}-${index}`,
        host: `10.204.${n}.2`,
        controlHost: `10.204.${n}.1`,
        dataHost: `qd${process.pid}${index}`,
        dataIP: `10.203.${n}.2`,
        gateway: `10.203.${n}.1`,
        controlDevice: `qc${process.pid}${index}`,
      }
      const ns = player.namespace
      root('ip', 'netns', 'add', ns)
      this.players.push(player) // Own it only after creation; cleanup covers later setup failures.
      root('ip', '-n', ns, 'link', 'set', 'lo', 'up')
      for (const [device, peer, hostIP, clientIP] of [
        [player.dataHost, 'data0', player.gateway, player.dataIP],
        [player.controlDevice, 'control0', player.controlHost, player.host],
      ]) {
        root('ip', 'link', 'add', device, 'type', 'veth', 'peer', 'name', `${device}p`)
        root('ip', 'link', 'set', `${device}p`, 'netns', ns)
        root('ip', '-n', ns, 'link', 'set', `${device}p`, 'name', peer)
        root('ip', 'addr', 'add', `${hostIP}/30`, 'dev', device)
        root('ip', 'link', 'set', device, 'up')
        root('ip', '-n', ns, 'addr', 'add', `${clientIP}/30`, 'dev', peer)
        root('ip', '-n', ns, 'link', 'set', peer, 'up')
      }
      root('ip', '-n', ns, 'route', 'add', 'default', 'via', player.gateway)
      root('mkdir', '-p', `/etc/netns/${ns}`)
      const resolver = '/run/systemd/resolve/resolv.conf'
      let dns = fs.readFileSync(fs.existsSync(resolver) ? resolver : '/etc/resolv.conf', 'utf8')
      if (/^nameserver 127\./m.test(dns)) dns = 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n'
      execFileSync('sudo', ['-n', 'tee', `/etc/netns/${ns}/resolv.conf`], {
        input: dns,
        stdio: ['pipe', 'ignore', 'pipe'],
        timeout: 60_000,
      })
      this.rule('nat', 'POSTROUTING', '-s', `${player.dataIP}/32`, '-j', 'MASQUERADE')
      this.rule('filter', 'FORWARD', '-i', player.dataHost, '-j', 'ACCEPT')
      this.rule(
        'filter',
        'FORWARD',
        '-o',
        player.dataHost,
        '-m',
        'conntrack',
        '--ctstate',
        'ESTABLISHED,RELATED',
        '-j',
        'ACCEPT'
      )
    }
    return this.players
  }

  private rule(table: string, chain: string, ...args: string[]): void {
    args.push('-m', 'comment', '--comment', this.tag)
    root('iptables', '-w', '-t', table, '-I', chain, ...args)
    this.rules.push({ table, chain, args })
  }

  isolateQss(): void {
    for (const player of this.players) {
      const prefix = ['ip', 'netns', 'exec', player.namespace, 'iptables', '-w', '-A', 'OUTPUT']
      root(...prefix, '-o', 'data0', '-p', 'tcp', '-d', this.players[0].gateway, '--dport', '3003', '-j', 'ACCEPT')
      root(...prefix, '-o', 'data0', '-j', 'REJECT')
    }
    console.log('QSS isolation: Tor runs, but relay access is blocked. QSS uses the shaped data link.')
  }

  close(): void {
    for (const player of [...this.players].reverse()) {
      const pids = bestEffort('ip', 'netns', 'pids', player.namespace).trim().split(/\s+/).filter(Boolean)
      if (pids.length) bestEffort('kill', '-KILL', ...pids)
      bestEffort('ip', 'netns', 'del', player.namespace)
      for (const device of [player.dataHost, player.controlDevice]) bestEffort('ip', 'link', 'del', device)
      bestEffort('rm', '-rf', `/etc/netns/${player.namespace}`)
    }
    for (const { table, chain, args } of [...this.rules].reverse()) {
      bestEffort('iptables', '-w', '-t', table, '-D', chain, ...args)
    }
    if (this.forwarding !== undefined) root('sysctl', '-q', '-w', `net.ipv4.ip_forward=${this.forwarding}`)
  }
}

async function throughput(
  player: NetworkPlayer,
  signal?: AbortSignal,
  reverse = false,
  control = false
): Promise<number> {
  const address = control ? player.host : player.dataIP
  const server = spawn('sudo', ['-n', 'ip', 'netns', 'exec', player.namespace, 'iperf3', '-s', '-1', '-B', address], {
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  let serverClosed = false
  let serverError: Error | undefined
  let serverOutput = ''
  server.once('close', () => {
    serverClosed = true
  })
  server.once('error', error => {
    serverError = error
  })
  server.stderr!.on('data', data => {
    serverOutput = (serverOutput + data).slice(-4096)
  })
  try {
    const deadline = Date.now() + 10_000
    let listening = false
    while (!listening) {
      if (signal?.aborted) throw new Error('Bandwidth check cancelled')
      if (serverError) throw serverError
      if (serverClosed) throw new Error(`Bandwidth server exited before listening: ${serverOutput}`)
      // Inspect the socket without connecting: a TCP readiness probe would
      // consume this one-shot server before the actual measurement starts.
      const readinessOptions = { timeout: 2000, signal }
      const { stdout } = await execute(
        'sudo',
        ['-n', 'ip', 'netns', 'exec', player.namespace, 'ss', '-H', '-ltn', 'sport = :5201'],
        readinessOptions
      )
      listening = stdout.includes(`${address}:5201`)
      if (listening) break
      if (Date.now() >= deadline) throw new Error(`Bandwidth server did not listen within 10 seconds: ${serverOutput}`)
      await sleep(50)
    }
    if (signal?.aborted) throw new Error('Bandwidth check cancelled')
    const options = { timeout: 60_000, signal }
    const { stdout } = await execute('iperf3', ['-c', address, '-t', '5', '-J', ...(reverse ? ['-R'] : [])], options)
    const data = JSON.parse(stdout)
    if (data.error) throw new Error(data.error)
    return data.end.sum_received.bits_per_second
  } finally {
    if (!serverClosed) {
      // Reusing the port before the previous server exits can connect the next
      // measurement to a dying server (iperf 3.9 reports "Bad file descriptor").
      server.kill('SIGTERM')
      await new Promise<void>((resolve, reject) => {
        const onClose = () => {
          clearTimeout(timer)
          resolve()
        }
        const timer = setTimeout(() => {
          server.off('close', onClose)
          reject(new Error('Bandwidth server did not stop within 2 seconds'))
        }, 2000)
        server.once('close', onClose)
      })
    }
  }
}

/** Actual TCP measurements, shared by the runner and Jest's harness coverage. */
export async function verifyBandwidth(players: NetworkPlayer[], signal?: AbortSignal): Promise<void> {
  const [player, other] = players
  setNetworkSpeed(player, 'slow')
  const down = await throughput(player, signal)
  const up = await throughput(player, signal, true)
  const control = await throughput(player, signal, false, true)
  const fast = await throughput(other, signal)
  console.log({ downloadBps: down, uploadBps: up, controlBps: control, otherPlayerBps: fast })
  assert(down > 300_000 && down < 1_400_000, `Download shaping ineffective: ${down}`)
  assert(up > 70_000 && up < 400_000, `Upload shaping ineffective: ${up}`)
  assert(control > 5_000_000, `WebDriver link was throttled: ${control}`)
  assert(fast > 5_000_000, `Other player was throttled: ${fast}`)
  setNetworkSpeed(player, 'fast')
  assert((await throughput(player, signal)) > 5_000_000, 'Fast profile did not recover')
  setNetworkSpeed(other, 'slow')
  const otherUp = await throughput(other, signal, true)
  assert(otherUp > 70_000 && otherUp < 400_000, `Other upload shaping ineffective: ${otherUp}`)
  setNetworkSpeed(other, 'fast')
}
