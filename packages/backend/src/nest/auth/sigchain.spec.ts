import { jest } from '@jest/globals'
import { SigChain } from './sigchain'
import { createLogger } from '../common/logger'
import { LocalUserContext } from '3rd-party/auth/packages/auth/dist'
import { base58 } from '@localfirst/crypto'
import { RANDOM_TEAM_NAME_LENGTH } from './types'
import { RANDOM_USERNAME_LENGTH } from './services/members/types'

const logger = createLogger('auth:sigchainManager.spec')

describe('SigChain', () => {
  let sigChain: SigChain

  it('should initialize a new sigchain and be admin', () => {
    sigChain = SigChain.create()
    expect(sigChain).toBeDefined()
    expect(sigChain.context).toBeDefined()
    expect(sigChain.roles.amIAdmin()).toBe(true)
    expect(sigChain.roles.amIMember()).toBe(true)
    expect(sigChain.teamName).toBeDefined()
    expect(base58.detect(sigChain.teamName!)).toBeTruthy()
    expect(sigChain.teamName?.length).toBe(RANDOM_TEAM_NAME_LENGTH)
    expect(base58.detect(sigChain.user.userName)).toBeTruthy()
    expect(sigChain.user.userName.length).toBe(RANDOM_USERNAME_LENGTH)
  })
  it('admin should not have a role that does not exist', () => {
    expect(sigChain.roles.amIMemberOfRole('nonexistent')).toBe(false)
  })
  it('should serialize the sigchain and load it', () => {
    const serializedChain = sigChain.save()
    const localUserContext = { user: sigChain.user, device: sigChain.device } as LocalUserContext
    const sigChain2 = SigChain.load(serializedChain, localUserContext, sigChain.team!.teamKeyring())
    expect(sigChain2).toBeDefined()
    expect(sigChain2.teamName).toBeDefined()
    expect(base58.detect(sigChain2.teamName!)).toBeTruthy()
    expect(sigChain2.teamName?.length).toBe(RANDOM_TEAM_NAME_LENGTH)
    expect(sigChain2.teamName).toBe(sigChain.teamName)
    expect(sigChain2.roles.amIAdmin()).toBe(true)
    expect(sigChain2.roles.amIMember()).toBe(true)
  })
})
