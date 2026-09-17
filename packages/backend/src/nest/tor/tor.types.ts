import * as child_process from 'child_process'
export enum GetInfoTorSignal {
  CONFIG_TEXT = 'config-text',
  CIRCUT_STATUS = 'circuit-status',
  ENTRY_GUARDS = 'entry-guards',
}

export interface TorParams {
  [arg: string]: string
}

interface IConstructor {
  torPath?: string
  options: child_process.SpawnOptionsWithoutStdio
  appDataPath: string
  httpTunnelPort: number
  controlPort?: number
  authCookie?: string
  extraTorProcessParams?: TorParams
}

export enum TorControlAuthType {
  COOKIE = 'cookie',
  PASSWORD = 'password',
}

export interface TorControlParams {
  port: number
  host: string
  auth: {
    type: TorControlAuthType
    value: string
  }
}

export interface TorControlCredentialsWaiter {
  promise: Promise<void>
  resolve: () => void
  reject: (error: Error) => void
}

export interface TorControlResponse {
  code: number
  messages: string[]
}

export type TorControlEventMatcher = (event: string, response: TorControlResponse) => boolean

export interface IParams {
  port: number
  family: number
}

export interface TorParamsProvider {
  torPath: string
  options: {
    env: {
      LD_LIBRARY_PATH: string | undefined
      HOME: string
    }
    detached: boolean
  }
  extraTorProcessParams?: TorParams
}

export interface TorPasswordProvider {
  torPassword: string
  torHashedPassword: string
}

export interface HiddenServiceData {
  targetPort: number
  privKey: string
  virtPort: number
  onionAddress: string
}

export type SpawnHiddenServiceParams = Omit<HiddenServiceData, 'virtPort'> & { virtPort?: number }

export type BootstrapStatus = {
  rawMessage: string
  done: boolean
  progress?: number
  tag?: string
  warning?: string
  reason?: string
  /**
   * Tor's own advice about the warning it just reported: `ignore` means Tor is
   * retrying and expects to recover, `warn` that the user should be told.
   */
  recommendation?: string
}

export type BootstrapStallState = {
  /** Highest progress seen this generation. Only an increase counts as progress. */
  highestProgress: number
  tag?: string
  /** When progress last increased - the clock a stall is measured against. */
  lastProgressAt: number
  /** Warnings Tor told us to ignore. Logged, never a reason to restart. */
  ignorableWarningCount: number
  lastSlowLogAt: number
}
