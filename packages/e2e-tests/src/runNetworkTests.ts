import { type ChildProcess, spawn } from 'child_process'
import { NetworkHarness, verifyBandwidth } from './networkHarness'

const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** The npm entry point holds flock; this process survives and cleans up its Jest child. */
export async function runWithNetwork(command: string[], checkBandwidth = true): Promise<number> {
  const network = new NetworkHarness()
  const controller = new AbortController()
  const cancel = () => controller.abort()
  let child: ChildProcess | undefined
  process.on('SIGINT', cancel)
  process.on('SIGTERM', cancel)
  try {
    const players = network.setup()
    if (checkBandwidth) await verifyBandwidth(players, controller.signal)
    if (controller.signal.aborted) return 130
    if (process.env.QUIET_NETWORK_QSS === 'true') network.isolateQss()
    child = spawn(command[0], command.slice(1), {
      detached: true,
      stdio: 'inherit',
      env: { ...process.env, QUIET_NETWORK_PLAYERS: JSON.stringify(players), LOCAL_TRANSPORT: 'false' },
    })
    return await new Promise<number>((resolve, reject) => {
      child!.once('error', reject)
      child!.once('exit', code => resolve(code ?? 1))
      controller.signal.addEventListener('abort', () => resolve(130), { once: true })
    })
  } catch (error) {
    if (controller.signal.aborted) return 130
    throw error
  } finally {
    // Kill the entire command group, including children left by a failed runner.
    if (child?.pid) {
      const killGroup = (signal: NodeJS.Signals) => {
        try {
          process.kill(-child!.pid!, signal)
        } catch (error) {
          if (error.code !== 'ESRCH') throw error
        }
      }
      try {
        killGroup('SIGTERM')
        if (child.exitCode === null && child.signalCode === null) {
          await Promise.race([new Promise(resolve => child!.once('exit', resolve)), sleep(1000)])
        }
        killGroup('SIGKILL')
      } finally {
        network.close()
      }
    } else network.close()
    process.off('SIGINT', cancel)
    process.off('SIGTERM', cancel)
  }
}

if (require.main === module) {
  const command = process.argv.slice(2)
  if (!command.length) throw new Error('Supply a test command to run in the network harness')
  console.log('Network-delay tests: Tor can take about 20 minutes; QSS does not wait for Tor.')
  runWithNetwork(command)
    .then(code => {
      process.exitCode = code
    })
    .catch(error => {
      console.error(error)
      process.exitCode = 1
    })
}
