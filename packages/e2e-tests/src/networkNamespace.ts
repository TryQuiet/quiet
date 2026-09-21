import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export interface NetworkNamespace {
  namespace: string
  host: string
  gateway: string
  controlHost: string
}

/** Keep the app, backend, and Tor together; only WebDriver crosses the control link. */
export function namespaceCommand(network: NetworkNamespace, command: string, args: string[]) {
  if (process.platform !== 'linux' || process.getuid?.() === undefined || process.getuid() === 0) {
    throw new Error('Network namespace tests require an unprivileged Linux user with sudo')
  }
  return {
    command: 'sudo',
    args: [
      '-n',
      'ip',
      'netns',
      'exec',
      network.namespace,
      'sudo',
      '-n',
      '-u',
      `#${process.getuid()}`,
      '--',
      process.execPath,
      path.resolve(__dirname, '../scripts/network/launch.cjs'),
      command,
      ...args,
    ],
    shell: false,
  }
}

export function stopNamespaceProcesses(network: NetworkNamespace): void {
  const pids = execFileSync('sudo', ['-n', 'ip', 'netns', 'pids', network.namespace], { encoding: 'utf8' })
    .trim()
    .split(/\s+/)
    .filter(pid => /^\d+$/.test(pid))
  if (pids.length) execFileSync('sudo', ['-n', 'kill', '-KILL', ...pids])
}

/** Observe the daemon itself, independently of backend log wording or Tor bootstrap. */
export async function waitForNamespaceTorProcess(
  network: NetworkNamespace,
  dataDirPath: string,
  timeoutMs = 15_000
): Promise<number> {
  const directory = path.join(dataDirPath, 'Quiet', 'TorDataDirectory')
  const pidFile = path.join(dataDirPath, 'Quiet', 'torPid.json')
  const namespaceInode = fs.statSync(`/run/netns/${network.namespace}`).ino
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const pid = Number(fs.readFileSync(pidFile, 'utf8').trim())
      if (Number.isSafeInteger(pid) && pid > 0) {
        const args = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0')
        const directoryIndex = args.indexOf('--DataDirectory')
        if (
          path.basename(args[0]) === 'tor' &&
          directoryIndex >= 0 &&
          args[directoryIndex + 1] === directory &&
          fs.statSync(`/proc/${pid}/ns/net`).ino === namespaceInode
        ) {
          return pid
        }
      }
    } catch (error) {
      // The PID file may not exist yet, or Tor may exit during inspection.
      if (error.code !== 'ENOENT' && error.code !== 'ESRCH') throw error
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`No Tor process for ${dataDirPath} in ${network.namespace} within ${timeoutMs}ms`)
}
