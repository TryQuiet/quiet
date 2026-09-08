import { jest } from '@jest/globals'
import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { RoleName } from '..//roles/roles'
import { UserService } from './user.service'
import { base58 } from '@localfirst/crypto'
import { RANDOM_TEAM_NAME_LENGTH } from '../../types'
import { RANDOM_USERNAME_LENGTH } from './types'

const logger = createLogger('auth:services:users.spec')

describe('users', () => {
  let adminSigChain: SigChain

  it('should initialize a new sigchain and be admin', () => {
    adminSigChain = SigChain.create()
    expect(adminSigChain).toBeDefined()
    expect(adminSigChain.context).toBeDefined()
    expect(adminSigChain.teamName).toBeDefined()
    expect(base58.detect(adminSigChain.teamName!)).toBeTruthy()
    expect(adminSigChain.teamName?.length).toBe(RANDOM_TEAM_NAME_LENGTH)
    expect(base58.detect(adminSigChain.user.userName)).toBeTruthy()
    expect(adminSigChain.user.userName.length).toBe(RANDOM_USERNAME_LENGTH)
    expect(adminSigChain.roles.amIAdmin()).toBe(true)
    expect(adminSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
  })
  it('should get keys', () => {
    const keys = adminSigChain.users.getKeys()
    expect(keys).toBeDefined()
  })
  it('get all members', () => {
    const users = adminSigChain.users.getAllUsers()
    expect(users).toBeDefined()
  })
  it('get admin member by id', () => {
    const users = adminSigChain.users.getUsersById([adminSigChain.user.userId])
    expect(users.map(u => u.userId)).toContain(adminSigChain.user.userId)
  })
  it('get admin member by name', () => {
    const user = adminSigChain.users.getUserById(adminSigChain.user.userId)
    expect(user.userName).toEqual(adminSigChain.user.userName)
  })
  it('should redact user', () => {
    const redactedUser = UserService.redactUser(adminSigChain.user)
    expect(redactedUser).toBeDefined()
    expect(redactedUser.userId).toBe(adminSigChain.user.userId)
    expect(redactedUser.userName).toBe(adminSigChain.user.userName)
  })
})
