import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { RoleName } from '..//roles/roles'
import { hash, randomBytes } from '@localfirst/crypto'
import * as uint8arrays from 'uint8arrays'
import { EncryptionScopeType, InviteLockboxMetadata } from './types'

const logger = createLogger('auth:services:lockbox.spec')

describe('lockbox', () => {
  let adminSigChain: SigChain
  let seed: string
  let salt: string
  let generatedKeys: InviteLockboxMetadata

  it('should initialize a new sigchain and be admin', () => {
    adminSigChain = SigChain.create('test', 'user')
    expect(adminSigChain).toBeDefined()
    expect(adminSigChain.context).toBeDefined()
    expect(adminSigChain.team!.teamName).toBe('test')
    expect(adminSigChain.user.userName).toBe('user')
    expect(adminSigChain.roles.amIMemberOfRole(RoleName.ADMIN)).toBe(true)
    expect(adminSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
  })
  it('should create keys from seed and salt', () => {
    seed = uint8arrays.toString(randomBytes(32), 'hex')
    salt = uint8arrays.toString(randomBytes(32), 'hex')
    generatedKeys = adminSigChain.lockbox.generateLockboxKeys(seed, salt)
    expect(generatedKeys.id).toBe(hash(salt, seed))
    expect(generatedKeys.keys.name).toBe(generatedKeys.id)
    expect(generatedKeys.keys.generation).toBe(0)
  })
  it('should create a lockbox encrypted to our generated keys', () => {
    const lockbox = adminSigChain.lockbox.createInviteLockbox(seed, salt)
    expect(lockbox.recipient.name).toBe(generatedKeys.id)
    expect(lockbox.recipient.generation).toBe(0)
    expect(lockbox.contents.name).toBe(RoleName.MEMBER)
    expect(lockbox.contents.type).toBe(EncryptionScopeType.ROLE)
  })
})
