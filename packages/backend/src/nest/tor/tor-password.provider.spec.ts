import { jest } from '@jest/globals'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { TorParamsProvider } from './tor.types'

const execFileSync = jest.fn(() => Buffer.from('16:HASHEDPASSWORD\n'))

jest.unstable_mockModule('child_process', () => ({
  execFileSync,
  execSync: jest.fn(),
  spawn: jest.fn(),
  default: { execFileSync, execSync: jest.fn(), spawn: jest.fn() },
}))

const { torPasswordProvider } = await import('./tor-password.provider')

describe('torPasswordProvider', () => {
  let quietDir: string

  const torParams: TorParamsProvider = {
    torPath: '/path/to/libtor.so',
    options: {
      env: {
        LD_LIBRARY_PATH: '/path/to/resources',
        HOME: '/home/user',
      },
      detached: false,
    },
  }

  beforeEach(() => {
    quietDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-tor-module-'))
  })

  afterEach(() => {
    fs.rmSync(quietDir, { recursive: true, force: true })
  })

  it('returns null when there is no tor binary path', () => {
    expect(torPasswordProvider.useFactory({ ...torParams, torPath: '' }, quietDir)).toBeNull()
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it('hashes the password passing an explicit DataDirectory', () => {
    const result = torPasswordProvider.useFactory(torParams, quietDir)

    const torDataDirectory = path.join(quietDir, 'TorDataDirectory')
    expect(fs.existsSync(torDataDirectory)).toBe(true)
    expect(execFileSync).toHaveBeenCalledTimes(1)

    const [binary, args, options] = jest.mocked(execFileSync).mock.calls[0] as unknown as [
      string,
      string[],
      { env: unknown },
    ]
    expect(binary).toBe(torParams.torPath)
    expect(args.slice(0, 4)).toEqual(['--quiet', '--DataDirectory', torDataDirectory, '--hash-password'])
    expect(args).toHaveLength(5)
    expect(args[4]).toMatch(/^[0-9a-f]{32}$/)
    expect(options.env).toEqual(torParams.options.env)

    expect(result).toEqual({ torPassword: args[4], torHashedPassword: '16:HASHEDPASSWORD' })
  })

  it('creates the data directory when the quiet dir does not exist yet', () => {
    const missingQuietDir = path.join(quietDir, 'nested', 'quiet')
    torPasswordProvider.useFactory(torParams, missingQuietDir)
    expect(fs.existsSync(path.join(missingQuietDir, 'TorDataDirectory'))).toBe(true)
  })
})
