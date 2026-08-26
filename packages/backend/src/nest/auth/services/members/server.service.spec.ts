import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { createServer, redactServer, Server } from '@localfirst/auth'

const logger = createLogger('auth:services:invite.spec')

describe('servers', () => {
  const adminSigChain = SigChain.create()
  const server: Server = redactServer(createServer({ host: 'testserver' }))

  it('should add server to chain', () => {
    adminSigChain.server.addServer(server)
  })

  it('should have one server on chain', () => {
    const servers = adminSigChain.server.getServers()
    expect(servers.length).toBe(1)
  })

  it('should find the server we added and be valid', () => {
    const thisServer = adminSigChain.server.getServer(server.host)
    expect(thisServer).toBeDefined()
    expect(thisServer?.host).toBe(server.host)
    expect(thisServer?.serverId).toBe(server.serverId)
    expect(thisServer?.identityKeys).toEqual(server.identityKeys)
    expect(thisServer?.keys).toEqual(server.keys)
  })
})
