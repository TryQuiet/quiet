import { execFileSync } from 'child_process'
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
