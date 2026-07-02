import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { RoleName } from '../roles/roles'
import { base58, hash, randomBytes } from '@localfirst/crypto'
import * as uint8arrays from 'uint8arrays'
import { EncryptionScopeType, InviteLockboxMetadata } from './types'
import { RANDOM_TEAM_NAME_LENGTH } from '../../types'

const logger = createLogger('auth:services:lockbox.spec')

describe('lockbox', () => {
  let adminSigChain: SigChain
  let seed: string
  let salt: string
  let generatedKeys: InviteLockboxMetadata

  it('should initialize a new sigchain and be admin', () => {
    adminSigChain = SigChain.create('user')
    expect(adminSigChain).toBeDefined()
    expect(adminSigChain.context).toBeDefined()
    expect(adminSigChain.teamName).toBeDefined()
    expect(base58.detect(adminSigChain.teamName!)).toBeTruthy()
    expect(adminSigChain.teamName?.length).toBe(RANDOM_TEAM_NAME_LENGTH)
    expect(adminSigChain.user.userName).toBe('user')
    expect(adminSigChain.roles.amIAdmin()).toBe(true)
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
    const lockboxes = adminSigChain.lockbox.createInviteLockboxes(seed, salt)
    expect(lockboxes).toHaveLength(1)
    const lockbox = lockboxes[0]
    expect(lockbox.recipient.name).toBe(generatedKeys.id)
    expect(lockbox.recipient.generation).toBe(0)
    expect(lockbox.contents.name).toBe(RoleName.MEMBER)
    expect(lockbox.contents.type).toBe(EncryptionScopeType.ROLE)

    const keysFromLockbox = adminSigChain.team?.allKeys(generatedKeys.keys)
    expect(keysFromLockbox).toBeDefined()
    expect(keysFromLockbox!['ROLE'][RoleName.MEMBER].length).toBe(1)
  })
})
