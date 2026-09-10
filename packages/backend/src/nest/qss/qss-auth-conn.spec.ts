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
import { type Socket as ClientSocket } from 'socket.io-client'

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
    openConnections.push(conn)
    return conn
  }

  /** Connections to tear down, so a started LFA machine's timers do not outlive the test. */
  const openConnections: QSSAuthConnection[] = []

  const emitJoined = (conn: QSSAuthConnection, payload: { team: unknown; user: unknown }): void => {
    ;(conn as any)._authConnection.emit(LFAEvents.JOINED, payload)
  }

  const emitConnected = (conn: QSSAuthConnection): void => {
    ;(conn as any)._authConnection.emit(LFAEvents.CONNECTED)
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
    for (const conn of openConnections.splice(0)) {
      try {
        conn.stop(false)
      } catch {
        // already stopped
      }
    }
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
  /**
   * private#203 L-2, with the iteration-2 correction. The QSS join used to
   * install the accepted team and set its status before awaiting the write, so a
   * failure left a completed-looking join that nothing re-entered.
   *
   * The write is now awaited first, and because the acceptance is already
   * validated and in memory a failure is retried locally rather than by asking
   * QSS for a second acceptance. Only once that budget is spent does the join
   * roll back and go get a new one.
   */
  describe('when the write fails', () => {
    let ownerModule: TestingModule
    let ownerSigChainService: SigChainService

    beforeEach(async () => {
      ownerModule = await buildModule()
      ownerSigChainService = await ownerModule.resolve(SigChainService)
    })

    afterEach(async () => {
      await ownerModule.close()
    })

    const buildInviteeChain = async (): Promise<{ inviteeChain: SigChain; team: any }> => {
      const ownerChain = await ownerSigChainService.createChain(true)
      const team = ownerChain.team!
      const invite = ownerChain.invites.createUserInvite()
      const inviteeChain = await sigChainService.createChainFromInvite({ seed: invite.seed }, team.id, true)
      return { inviteeChain, team }
    }

    it('converges on a retried local write without asking for a second acceptance', async () => {
      const { inviteeChain, team } = await buildInviteeChain()
      const conn = await buildConnection(sigChainService, qssClient, inviteeChain, team.id)
      const restartSpy = jest.spyOn(conn, 'start')

      const original = localDbService.setSigChain.bind(localDbService)
      let failuresLeft = 1
      jest.spyOn(localDbService, 'setSigChain').mockImplementation(async (chain: SigChain, id: string) => {
        if (failuresLeft > 0) {
          failuresLeft -= 1
          throw new Error('transient LevelDB failure')
        }
        return original(chain, id)
      })

      const joined: (string | undefined)[] = []
      conn.on(QSSEvents.QSS_AUTH_JOINED, (id: string | undefined) => joined.push(id))

      emitJoined(conn, { team, user: inviteeChain.user })

      await waitForExpect(() => {
        expect(joined).toEqual([team.id])
      }, 15_000)

      expect(inviteeChain.team).not.toBeNull()
      expect(conn.joinStatus).toBe(JoinStatus.PENDING_MEMBER)
      // The acceptance we already held was enough: no reconnect, no new handshake.
      expect(restartSpy).not.toHaveBeenCalled()
    })

    it('rolls the fresh join back once the local write budget is spent', async () => {
      const { inviteeChain, team } = await buildInviteeChain()
      const conn = await buildConnection(sigChainService, qssClient, inviteeChain, team.id)
      const statusBefore = conn.joinStatus

      jest.spyOn(localDbService, 'setSigChain').mockRejectedValue(new Error('disk is on fire'))
      const joined: (string | undefined)[] = []
      const selfAssign: (string | undefined)[] = []
      conn.on(QSSEvents.QSS_AUTH_JOINED, (id: string | undefined) => joined.push(id))
      conn.on(QSSEvents.QSS_SELF_ASSIGN_MEMBER, (id: string | undefined) => selfAssign.push(id))

      emitJoined(conn, { team, user: inviteeChain.user })

      // The staged team is gone: the chain is an invitee again, not a member
      // holding a team it never stored.
      await waitForExpect(() => {
        expect(inviteeChain.team).toBeNull()
      }, 15_000)
      expect(joined).toHaveLength(0)
      expect(selfAssign).toHaveLength(0)
      expect(conn.joinStatus).toBe(statusBefore)
    })

    it('rolls a role-completion join back to its previous status', async () => {
      // A chain that already holds the team but not the member role: this is the
      // branch that only flips the status, so that flip is what must roll back.
      const { inviteeChain, team } = await buildInviteeChain()
      inviteeChain.context = {
        device: (inviteeChain.context as any).device,
        team,
        user: inviteeChain.user,
      } as any
      const conn = await buildConnection(sigChainService, qssClient, inviteeChain, team.id)
      const statusBefore = conn.joinStatus
      expect(statusBefore).not.toBe(JoinStatus.JOINED)

      jest.spyOn(localDbService, 'setSigChain').mockRejectedValue(new Error('disk is on fire'))
      const joined: (string | undefined)[] = []
      conn.on(QSSEvents.QSS_AUTH_JOINED, (id: string | undefined) => joined.push(id))

      emitJoined(conn, { team, user: inviteeChain.user })

      await waitForExpect(() => {
        expect(conn.joinStatus).toBe(statusBefore)
        expect((conn as any)._authConnection).toBeUndefined()
      }, 15_000)
      expect(joined).toHaveLength(0)
    })

    /**
     * private#203 iteration-3 L-1. A transport drop used to cancel the local
     * write retry without committing or undoing the staged team, so the chain
     * kept a team that had never been written; a later connect then read that as
     * restored state and published a join for it.
     */
    it('does not leave a staged team behind when the transport drops mid-write', async () => {
      const { inviteeChain, team } = await buildInviteeChain()
      const conn = await buildConnection(sigChainService, qssClient, inviteeChain, team.id)

      const setSigChainSpy = jest
        .spyOn(localDbService, 'setSigChainFromTeam')
        .mockRejectedValue(new Error('disk is on fire'))
      const joined: (string | undefined)[] = []
      const selfAssign: (string | undefined)[] = []
      conn.on(QSSEvents.QSS_AUTH_JOINED, (id: string | undefined) => joined.push(id))
      conn.on(QSSEvents.QSS_SELF_ASSIGN_MEMBER, (id: string | undefined) => selfAssign.push(id))

      emitJoined(conn, { team, user: inviteeChain.user })

      // The first write has failed and a local retry is queued.
      await waitForExpect(() => {
        expect(setSigChainSpy).toHaveBeenCalled()
      }, 10_000)
      expect(inviteeChain.team).not.toBeNull()

      // QSS drops before that retry fires.
      conn.stop(false)

      // The staged team goes with it, rather than sitting on the chain unwritten.
      expect(inviteeChain.team).toBeNull()
      expect(joined).toHaveLength(0)
      expect(selfAssign).toHaveLength(0)

      // A later connection has nothing to mistake for restored state.
      const reconnected = await buildConnection(
        sigChainService,
        qssClient,
        sigChainService.getChain(team.id),
        team.id + '-second'
      )
      reconnected.on(QSSEvents.QSS_AUTH_JOINED, (id: string | undefined) => joined.push(id))
      reconnected.on(QSSEvents.QSS_SELF_ASSIGN_MEMBER, (id: string | undefined) => selfAssign.push(id))
      emitConnected(reconnected)

      await new Promise(resolve => setTimeout(resolve, 100))
      expect(joined).toHaveLength(0)
      expect(selfAssign).toHaveLength(0)
    })

    it('never reads a staged team as restored state on connect', async () => {
      const { inviteeChain, team } = await buildInviteeChain()
      const conn = await buildConnection(sigChainService, qssClient, inviteeChain, team.id)

      jest.spyOn(localDbService, 'setSigChainFromTeam').mockRejectedValue(new Error('disk is on fire'))
      const joined: (string | undefined)[] = []
      const selfAssign: (string | undefined)[] = []
      conn.on(QSSEvents.QSS_AUTH_JOINED, (id: string | undefined) => joined.push(id))
      conn.on(QSSEvents.QSS_SELF_ASSIGN_MEMBER, (id: string | undefined) => selfAssign.push(id))

      emitJoined(conn, { team, user: inviteeChain.user })
      await waitForExpect(() => {
        expect(inviteeChain.team).not.toBeNull()
      }, 10_000)

      // The team is staged and its write has not landed. Connect must publish
      // nothing on the strength of the team simply being present.
      emitConnected(conn)

      await new Promise(resolve => setTimeout(resolve, 100))
      expect(joined).toHaveLength(0)
      expect(selfAssign).toHaveLength(0)
    })

    // private#203 iteration-2 L-1: a rejected retry callback used to consume an
    // attempt and then wait for an unrelated event.
    it('keeps re-attempting when the reconnect itself throws', async () => {
      const { inviteeChain, team } = await buildInviteeChain()
      const conn = await buildConnection(sigChainService, qssClient, inviteeChain, team.id)

      jest.spyOn(localDbService, 'setSigChain').mockRejectedValue(new Error('disk is on fire'))
      // start() rejects the way it would with no QSS socket available.
      const startSpy = jest.spyOn(conn, 'start').mockRejectedValue(new Error('no QSS socket'))

      emitJoined(conn, { team, user: inviteeChain.user })

      // One failing reconnect must not end the schedule: the budget is spent
      // without anything external calling back in.
      await waitForExpect(() => {
        expect(startSpy.mock.calls.length).toBeGreaterThanOrEqual(3)
      }, 30_000)
    })
  })
})
