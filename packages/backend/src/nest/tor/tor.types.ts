import * as child_process from 'child_process'
export enum GetInfoTorSignal {
    CONFIG_TEXT = 'config-text',
    CIRCUT_STATUS = 'circuit-status',
    ENTRY_GUARDS = 'entry-guards'
  }

  export interface TorParams {[arg: string]: string}

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
    PASSWORD = 'password'
  }

  export interface TorControlParams {
    port: number
    host: string
    auth: {
      type: TorControlAuthType
      value: string
    }
  }

  export interface IParams {
    port: number
    family: number
  }

  export interface TorParamsProvider{
    torPath: string
    options: {
      env: {
          LD_LIBRARY_PATH: string | undefined
          HOME: string
      }
      detached: boolean
  }
  }

  export interface TorPasswordProvider{
    torPassword: string
    torHashedPassword: string
  }
