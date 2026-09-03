import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import waitForExpect from 'wait-for-expect'

import { TestModule } from '../common/test.module'
import { QSS_ALLOWED } from '../const'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { SigChain } from '../auth/sigchain'
import { SigChainService } from '../auth/sigchain.service'
import { SigChainModule } from '../auth/sigchain.service.module'
import { LFAEvents } from '../auth/types'
import { JoinStatus } from '../libp2p/libp2p.auth'
import { QSSAuthConnection } from './qss-auth-conn'
import { QSSClient } from './qss.client'
import { QSSEvents } from './qss.types'
import { QSSModule } from './qss.module'

/**
 * QSS-006: QSS_AUTH_JOINED is the backend's signal that we hold a usable team,
 * and QSS has already seen the acceptance by the time it fires. The chain
 * therefore has to be on disk first. Before this fix the "already had a team"
 * branch wrote fire-and-forget and the "fresh join" branch wrote nothing at all,
 * so a crash right after the event came back without the graph.
 */
describe('QSSAuthConnection - durable join', () => {
  const deferred = <T = void>() => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>(res => {
      resolve = res
    })
    return { promise, resolve }
  }

  const buildModule = async (): Promise<TestingModule> =>
    Test.createTestingModule({
      imports: [TestModule, QSSModule, SigChainModule, LocalDbModule],
      providers: [
        {
          provide: QSS_ALLOWED,
          useFactory: () => true,
        },
      ],
    }).compile()

  /** Builds a connection with its LFA event handlers registered but not started. */
  const buildConnection = async (
    sigChainService: SigChainService,
    qssClient: QSSClient,
    sigChain: SigChain,
    teamId: string
  ): Promise<QSSAuthConnection> => {
    const conn = new QSSAuthConnection(sigChainService, qssClient)
    conn.teamId = teamId
    await (conn as any)._initNewConn(sigChain)
    return conn
  }

  const emitJoined = (conn: QSSAuthConnection, payload: { team: unknown; user: unknown }): void => {
    ;(conn as any)._authConnection.emit(LFAEvents.JOINED, payload)
  }

  let module: TestingModule
  let sigChainService: SigChainService
  let localDbService: LocalDbService
  let qssClient: QSSClient

  beforeEach(async () => {
    module = await buildModule()
    sigChainService = await module.resolve(SigChainService)
    localDbService = await module.resolve(LocalDbService)
    qssClient = module.get<QSSClient>(QSSClient)
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await module.close()
  })

  describe('when we already hold the team', () => {
    it('emits QSS_AUTH_JOINED only after the chain write resolves', async () => {
      const sigChain = await sigChainService.createChain(true)
      const team = sigChain.team!
      const conn = await buildConnection(sigChainService, qssClient, sigChain, team.id)

      const write = deferred()
      const setSigChainSpy = jest.spyOn(localDbService, 'setSigChain').mockImplementation(async () => {
        await write.promise
      })
      const joined: (string | undefined)[] = []
      conn.on(QSSEvents.QSS_AUTH_JOINED, (id: string | undefined) => joined.push(id))

      emitJoined(conn, { team, user: sigChain.user })

      await waitForExpect(() => {
        expect(setSigChainSpy).toHaveBeenCalledTimes(1)
      })
      expect(joined).toHaveLength(0)

      write.resolve()

      await waitForExpect(() => {
        expect(joined).toEqual([team.id])
      })
      expect(conn.joinStatus).toBe(JoinStatus.JOINED)
    })

    it('does not signal joined when the chain write fails', async () => {
      const sigChain = await sigChainService.createChain(true)
      const team = sigChain.team!
      const conn = await buildConnection(sigChainService, qssClient, sigChain, team.id)

      jest.spyOn(localDbService, 'setSigChain').mockRejectedValue(new Error('disk is on fire'))
      const joined: (string | undefined)[] = []
      conn.on(QSSEvents.QSS_AUTH_JOINED, (id: string | undefined) => joined.push(id))

      emitJoined(conn, { team, user: sigChain.user })

      await new Promise(resolve => setTimeout(resolve, 100))
      expect(joined).toHaveLength(0)
    })
  })

  describe('when the team arrives with the join', () => {
    let ownerModule: TestingModule
    let ownerSigChainService: SigChainService

    beforeEach(async () => {
      ownerModule = await buildModule()
      ownerSigChainService = await ownerModule.resolve(SigChainService)
    })

    afterEach(async () => {
      await ownerModule.close()
    })

    /**
     * A second device that has an invite seed but no team yet: this is the
     * branch that used to leave the accepted graph in memory only.
     */
    const buildInviteeChain = async (): Promise<{ inviteeChain: SigChain; team: any }> => {
      const ownerChain = await ownerSigChainService.createChain(true)
      const team = ownerChain.team!
      const invite = ownerChain.invites.createUserInvite()
      const inviteeChain = await sigChainService.createChainFromInvite({ seed: invite.seed }, team.id, true)
      expect(inviteeChain.team).toBeNull()
      return { inviteeChain, team }
    }

    it('persists the freshly accepted graph before emitting QSS_AUTH_JOINED', async () => {
      const { inviteeChain, team } = await buildInviteeChain()
      const conn = await buildConnection(sigChainService, qssClient, inviteeChain, team.id)

      const write = deferred()
      const setSigChainSpy = jest.spyOn(localDbService, 'setSigChain').mockImplementation(async () => {
        await write.promise
      })
      const joined: (string | undefined)[] = []
      const selfAssign: (string | undefined)[] = []
      conn.on(QSSEvents.QSS_AUTH_JOINED, (id: string | undefined) => joined.push(id))
      conn.on(QSSEvents.QSS_SELF_ASSIGN_MEMBER, (id: string | undefined) => selfAssign.push(id))

      emitJoined(conn, { team, user: inviteeChain.user })

      // Regression: this branch previously issued no write at all.
      await waitForExpect(() => {
        expect(setSigChainSpy).toHaveBeenCalledTimes(1)
      })
      expect(joined).toHaveLength(0)
      expect(selfAssign).toHaveLength(0)

      write.resolve()

      await waitForExpect(() => {
        expect(joined).toEqual([team.id])
        expect(selfAssign).toEqual([team.id])
      })
      expect(conn.joinStatus).toBe(JoinStatus.PENDING_MEMBER)
    })

    it('writes a graph that can be read back from the real database', async () => {
      const { inviteeChain, team } = await buildInviteeChain()
      const conn = await buildConnection(sigChainService, qssClient, inviteeChain, team.id)

      const joined: (string | undefined)[] = []
      conn.on(QSSEvents.QSS_AUTH_JOINED, (id: string | undefined) => joined.push(id))

      emitJoined(conn, { team, user: inviteeChain.user })

      await waitForExpect(() => {
        expect(joined).toEqual([team.id])
      })

      const stored = await localDbService.getSigChain(team.id)
      expect(stored).toBeDefined()
      expect(stored!.serializedTeam).toBeDefined()
      expect(stored!.teamKeyRing).toBeDefined()
    })

    it('does not signal joined or ask for a member self-assign when the write fails', async () => {
      const { inviteeChain, team } = await buildInviteeChain()
      const conn = await buildConnection(sigChainService, qssClient, inviteeChain, team.id)

      jest.spyOn(localDbService, 'setSigChain').mockRejectedValue(new Error('disk is on fire'))
      const joined: (string | undefined)[] = []
      const selfAssign: (string | undefined)[] = []
      conn.on(QSSEvents.QSS_AUTH_JOINED, (id: string | undefined) => joined.push(id))
      conn.on(QSSEvents.QSS_SELF_ASSIGN_MEMBER, (id: string | undefined) => selfAssign.push(id))

      emitJoined(conn, { team, user: inviteeChain.user })

      await new Promise(resolve => setTimeout(resolve, 100))
      expect(joined).toHaveLength(0)
      expect(selfAssign).toHaveLength(0)
    })
  })
})
