/* eslint import/first: 0 */
jest.mock('./marshalling')
jest.mock('../vendor/buttercup')
jest.mock('@buttercup/channel-queue', () => jest.fn())
import ChannelQueue from '@buttercup/channel-queue'

import Vault from './vault'
import { Credentials } from '../vendor/buttercup'
import {
  credentialsFromSecureStrings,
  credentialsToWorkspace,
  credentialsToSecureStrings
} from './marshalling'

describe('Vault', () => {
  let stateQueue
  beforeEach(() => {
    jest.clearAllMocks()
    stateQueue = []

    ChannelQueue.mockImplementation(() => ({
      channel: jest.fn(() => ({
        enqueue: jest.fn(async (cb) => stateQueue.push(cb))
      }))
    }))
  })

  it('throws when source credentials are not a secure string', () => {
    Credentials.isSecureString.mockReturnValue(false)
    expect(() => new Vault(jest.mock(), jest.mock())).toThrowErrorMatchingSnapshot()
  })

  it('throws when archive credentials are not a secure string', () => {
    Credentials.isSecureString
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
    expect(() => new Vault(jest.mock(), jest.mock())).toThrowErrorMatchingSnapshot()
  })

  it('creates workspace on unlock', async () => {
    const masterPassword = 'master-password-tests'
    const createSource = true

    Credentials.isSecureString.mockReturnValue(true)

    const sourceCredentials = jest.mock()
    const archiveCredentials = jest.mock()
    credentialsFromSecureStrings.mockResolvedValue([sourceCredentials, archiveCredentials])

    const secureSource = jest.mock()
    const secureArchive = jest.mock()
    const vault = new Vault(secureSource, secureArchive)

    const workspace = jest.mock()
    credentialsToWorkspace.mockResolvedValue(workspace)

    await vault.unlock(masterPassword, createSource)

    expect(stateQueue).toHaveLength(1)
    const [unlockCb] = stateQueue
    expect(credentialsFromSecureStrings).not.toHaveBeenCalled()
    expect(credentialsToWorkspace).not.toHaveBeenCalled()

    await unlockCb()

    expect(credentialsFromSecureStrings).toHaveBeenCalledWith({
      sourceCredentials: secureSource,
      archiveCredentials: secureArchive,
      masterPassword
    })
    expect(credentialsToWorkspace).toHaveBeenCalledWith({
      sourceCredentials,
      archiveCredentials,
      createSource
    })
    expect(vault._workspace).toEqual(workspace)
    expect(vault._sourceCredentials).toEqual(sourceCredentials)
    expect(vault._archiveCredentials).toEqual(archiveCredentials)
  })

  it('saves and clears workspace on lock', async () => {
    const masterPassword = 'master-password-tests'
    const createSource = true

    Credentials.isSecureString.mockReturnValue(true)

    const sourceCredentials = jest.mock()
    const archiveCredentials = jest.mock()
    credentialsFromSecureStrings.mockResolvedValue([sourceCredentials, archiveCredentials])

    const secureSource = jest.mock()
    const secureArchive = jest.mock()
    const vault = new Vault(secureSource, secureArchive)

    const workspace = {
      save: jest.fn()
    }
    credentialsToWorkspace.mockResolvedValue(workspace)

    credentialsToSecureStrings.mockResolvedValue([secureSource, secureArchive])

    await vault.unlock(masterPassword, createSource)
    await vault.lock()

    expect(stateQueue).toHaveLength(2)
    const [unlockCb, lockCb] = stateQueue
    await unlockCb()

    expect(credentialsToSecureStrings).not.toHaveBeenCalled()
    expect(workspace.save).not.toHaveBeenCalled()

    await lockCb()

    expect(credentialsToSecureStrings).toHaveBeenCalledWith({
      sourceCredentials: secureSource,
      archiveCredentials: secureArchive
    })
    expect(workspace.save).toHaveBeenCalledTimes(1)
    expect(vault._workspace).toBeNull()
    expect(vault._sourceCredentials).toEqual(secureSource)
    expect(vault._archiveCredentials).toEqual(secureArchive)
  })

  it('provides queued access to workspace', async () => {
    Credentials.isSecureString.mockReturnValue(true)
    credentialsFromSecureStrings.mockResolvedValue([jest.mock, jest.mock()])
    const workspace = jest.mock()
    credentialsToWorkspace.mockResolvedValue(workspace)
    const callback = jest.fn()

    const vault = new Vault(jest.mock(), jest.mock())

    // Create workspace
    await vault.unlock('master-password', true)

    await vault.withWorkspace(callback)
    expect(stateQueue).toHaveLength(2)

    const [unlockCb, withWorkspaceCb] = stateQueue
    await unlockCb()
    await withWorkspaceCb()
    expect(callback).toHaveBeenCalledWith(workspace)
  })
})
