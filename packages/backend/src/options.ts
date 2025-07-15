/* eslint-disable @typescript-eslint/no-explicit-any */
import commander from 'commander'

export interface OpenServices {
  torControlPort?: any
  socketIOPort?: any
  socketIOSecret?: any
  httpTunnelPort?: any
  authCookie?: any
}

interface Options {
  platform?: any
  dataPath?: any
  dataPort?: any
  torBinary?: any
  authCookie?: any
  controlPort?: any
  httpTunnelPort?: any
  appDataPath?: string
  socketIOPort?: number
  resourcesPath?: string
}

// concept
export const validateOptions = (_options: commander.OptionValues) => {}
