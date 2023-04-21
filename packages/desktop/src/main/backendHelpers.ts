import { hangingBackendProcessCommand } from '@quiet/common'
import { execSync } from 'child_process'
import getPort from 'get-port'

export const getPorts = async (): Promise<{
  socksPort: number
  libp2pHiddenService: number
  controlPort: number
  httpTunnelPort: number
  dataServer: number
}> => {
  const controlPort = await getPort()
  const httpTunnelPort = await getPort()
  const socksPort = await getPort()
  const libp2pHiddenService = await getPort()
  const dataServer = await getPort()
  return {
    socksPort,
    libp2pHiddenService,
    controlPort,
    httpTunnelPort,
    dataServer
  }
}

export type ApplicationPorts = Awaited<ReturnType<typeof getPorts>>

export const closeHangingBackendProcess = (backendBundlePath: string, dataDir: string) => {
  const command = hangingBackendProcessCommand({ backendBundlePath, dataDir })
  if (!command) return
  console.log('commmand', command)
  const backendPid = execSync(command).toString('utf8').trim()
  console.log('backendPID', backendPid)
  if (!backendPid) return
  const PIDs = backendPid.split('\n')
  console.log(`Found ${PIDs.length} hanging backend process(es) with pid(s) ${PIDs}. Killing...`)
  for (const pid of PIDs) {
    try {
      process.kill(Number(pid), 'SIGKILL')
    } catch (e) {
      console.error(`Tried killing hanging backend process (PID: ${pid}). Failed. Reason: ${e.message}`)
    }
  }
}
