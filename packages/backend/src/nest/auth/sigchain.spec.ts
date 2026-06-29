import { jest } from '@jest/globals'
import { SigChain } from './sigchain'
import { SigChainService } from './sigchain.service'
import { createLogger } from '../common/logger'
import { LocalUserContext } from '3rd-party/auth/packages/auth/dist'
import exp from 'constants'
import { RoleName } from './services/roles/roles'
import { UserService } from './services/members/user.service'

const logger = createLogger('auth:sigchainManager.spec')

describe('SigChain', () => {
  let sigChain: SigChain
  const teamName = 'test'
  const obfuscatedTeamName = SigChain.generateTeamName(teamName)
  const userName = 'user'

  it('should initialize a new sigchain and be admin', () => {
    sigChain = SigChain.create(teamName, userName)
    expect(sigChain).toBeDefined()
    expect(sigChain.context).toBeDefined()
    expect(sigChain.roles.amIAdmin()).toBe(true)
    expect(sigChain.roles.amIMember()).toBe(true)
    expect(sigChain.teamName).toBe(obfuscatedTeamName)
    expect(sigChain.user.userName).toBe(userName)
  })
  it('admin should not have a role that does not exist', () => {
    expect(sigChain.roles.amIMemberOfRole('nonexistent')).toBe(false)
  })
  it('should serialize the sigchain and load it', () => {
    const serializedChain = sigChain.save()
    const localUserContext = { user: sigChain.user, device: sigChain.device } as LocalUserContext
    const sigChain2 = SigChain.load(serializedChain, localUserContext, sigChain.team!.teamKeyring())
    expect(sigChain2).toBeDefined()
    expect(sigChain2.teamName).toBe(obfuscatedTeamName)
    expect(sigChain2.roles.amIAdmin()).toBe(true)
    expect(sigChain2.roles.amIMember()).toBe(true)
  })
})
