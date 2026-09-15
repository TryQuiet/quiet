import { jest } from '@jest/globals'
import EventEmitter from 'node:events'
import waitForExpect from 'wait-for-expect'
import { ChannelMessage, MessageType, PublicChannel } from '@quiet/types'
import { SigChain } from '../auth/sigchain'
import { SigChainService } from '../auth/sigchain.service'
import { InviteService } from '../auth/services/invites/invite.service'
import { RoleName } from '../auth/services/roles/roles'
import { EncryptionScopeType } from '../auth/services/crypto/types'
import { JoinStatus } from '../libp2p/libp2p.auth'
import { QSSAuthConnStatus } from '../qss/qss.const'
import { QSSSyncManager } from '../qss/qss-sync-manager.service'
import { CommunityOperationStatus, WebsocketEvents } from '../qss/qss.types'
import { PrivateChannelMessagesService } from '../storage/channels/messages/private-channel-messages.service'
import { PublicChannelMessagesService } from '../storage/channels/messages/public-channel-messages.service'
import { LogUpdate, OrbitDbOp } from '../storage/orbitDb/orbitdb.types'
import { QPSService } from './qps.service'

describe('private-channel push recipients after QSS sync', () => {
  let chain: SigChain
  let channel: PublicChannel
  let sigChainService: SigChainService
  let manager: QSSSyncManager
  let qssClient: any
  let pending: Record<string, string[]>
  let updates: Map<string, LogUpdate>

  const privateUcans = ['owner-phone', 'member-phone', 'member-tablet']
  const allUcans = [...privateUcans, 'outsider-phone']

  const addMember = () => {
    const invite = chain.invites.createUserInvite()
    const invitee = SigChain.createFromInvite({ seed: invite.seed }, chain.team!.id)
    chain.invites.admitMemberFromInvite(
      InviteService.createMemberAdmission({ seed: invite.seed, context: invitee.context })
    )
    return invitee.user.userId
  }

  const makeUpdate = (value: unknown): LogUpdate => {
    const hash = `entry-${updates.size}`
    const update = {
      teamId: chain.team!.id,
      id: 'channel-db-id',
      addr: 'channel-db-address',
      hash,
      entry: { id: 'channel-db-id', hash, payload: { op: OrbitDbOp.PUT, key: hash, value } },
    } as unknown as LogUpdate
    updates.set(hash, update)
    return update
  }

  const messageUpdate = async (isPublic = false) => {
    const message: ChannelMessage = {
      id: 'message-id',
      channelId: channel.id,
      userId: chain.user.userId,
      message: 'Private discussion',
      type: MessageType.Basic,
      createdAt: Date.now(),
    }
    const service = isPublic
      ? new PublicChannelMessagesService(sigChainService)
      : new PrivateChannelMessagesService(sigChainService)
    return makeUpdate(
      await service.onSend(message, isPublic ? { ...channel, public: true, roleName: undefined } : channel)
    )
  }

  const pushCalls = () =>
    qssClient.sendMessage.mock.calls.filter(
      ([event]: [WebsocketEvents, unknown, boolean]) => event === WebsocketEvents.SEND_BATCH_PUSH
    )

  const expectRecipients = async (ucans: string[]) => {
    await waitForExpect(() => {
      expect(pushCalls()).toEqual([
        [WebsocketEvents.SEND_BATCH_PUSH, expect.objectContaining({ payload: { ucans } }), true],
      ])
    })
  }

  beforeEach(() => {
    chain = SigChain.create()
    const memberId = addMember()
    const outsiderId = addMember()
    const roleName = chain.channels.createWithMembers([memberId])
    channel = {
      id: 'private-channel-id',
      name: 'private-channel',
      description: '',
      timestamp: Date.now(),
      owner: chain.user.userId,
      public: false,
      roleName,
    }
    sigChainService = Object.assign(new EventEmitter(), {
      activeChain: chain,
      activeTeamId: chain.team!.id,
      getChain: (teamId: string) => {
        if (teamId !== chain.team!.id) throw new Error('Unknown team')
        return chain
      },
      getActiveChain: () => chain,
    }) as unknown as SigChainService
    qssClient = Object.assign(new EventEmitter(), {
      connected: true,
      sendMessage: jest
        .fn<any>()
        .mockImplementation(async (_event: WebsocketEvents, message: { payload: unknown }) => ({
          status: CommunityOperationStatus.SUCCESS,
          payload: message.payload,
        })),
    })
    const socketService = Object.assign(new EventEmitter(), { serverIoProvider: { io: { emit: jest.fn() } } })
    const authConnections = Object.assign(new EventEmitter(), {
      getConnection: () => ({ connStatus: QSSAuthConnStatus.CONNECTED, joinStatus: JoinStatus.JOINED }),
    })
    pending = {}
    updates = new Map()
    const localDbService = {
      getCurrentCommunity: async () => ({ qssEnabled: true, qssSetup: true }),
      addPendingQssLogSyncMessage: async (address: string, hash: string) => {
        pending[address] = [...(pending[address] ?? []), hash]
      },
      getPendingQssLogSyncMessages: async () => ({ ...pending }),
      removePendingQssLogSyncMessages: async (removed: Record<string, string[]>) => {
        for (const [address, hashes] of Object.entries(removed)) {
          pending[address] = pending[address].filter(hash => !hashes.includes(hash))
          if (pending[address].length === 0) delete pending[address]
        }
      },
    }
    manager = new QSSSyncManager(
      true,
      'ws://localhost:3000',
      qssClient,
      authConnections as any,
      sigChainService,
      localDbService as any,
      {
        getLogEntriesByHashes: async (_address: string, hashes: string[]) =>
          hashes.map(hash => updates.get(hash)!.entry),
      } as any,
      socketService as any,
      {} as any
    )
    jest.spyOn(manager, 'startLogPullInterval').mockImplementation(() => {})
    manager.startLogSyncForSignedInTeam(chain.team!.id, chain)
    const qps = new QPSService(
      true,
      socketService as any,
      qssClient,
      new EventEmitter() as any,
      manager,
      sigChainService,
      {
        getAllEntries: async () => [
          { userId: chain.user.userId, tokens: ['owner-phone'] },
          { userId: memberId, tokens: ['member-phone', 'member-tablet'] },
          { userId: outsiderId, tokens: ['outsider-phone'] },
        ],
      } as any
    )
    qps.onModuleInit()
  })

  afterEach(() => manager.close())

  it('notifies only the private channel members despite team-wide transport encryption', async () => {
    await manager.sendLogEntrySyncMessage(await messageUpdate())

    const sync = qssClient.sendMessage.mock.calls[0][1]
    expect(sync.payload.encEntry.encrypted.scope.name).toBe(RoleName.MEMBER)
    await expectRecipients(privateUcans)
  })

  it('continues notifying all community members for public messages', async () => {
    await manager.sendLogEntrySyncMessage(await messageUpdate(true))
    await expectRecipients(allUcans)
  })

  it('also scopes private channel metadata syncs to the channel members', async () => {
    const value = chain.crypto.encryptAndSign(channel, { type: EncryptionScopeType.ROLE, name: channel.roleName })
    await manager.sendLogEntrySyncMessage(makeUpdate(value))
    await expectRecipients(privateUcans)
  })

  it('preserves the private audience when replaying an offline entry from the dead letter queue', async () => {
    const update = await messageUpdate()
    qssClient.connected = false
    await manager.sendLogEntrySyncMessage(update)
    expect(pushCalls()).toEqual([])
    expect(pending).toEqual({ [update.addr]: [update.hash] })

    qssClient.connected = true
    manager.markTeamStorageReady(chain.team!.id)
    await expectRecipients(privateUcans)
    await waitForExpect(() => expect(pending).toEqual({}))
  })

  it('does not push until QSS acknowledges the private entry', async () => {
    let acknowledge!: (value: unknown) => void
    qssClient.sendMessage.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          acknowledge = resolve
        })
    )
    const syncing = manager.sendLogEntrySyncMessage(await messageUpdate())
    await waitForExpect(() => expect(acknowledge).toBeDefined())
    expect(pushCalls()).toEqual([])

    acknowledge({ status: CommunityOperationStatus.SUCCESS, payload: {} })
    await syncing
    await expectRecipients(privateUcans)
  })

  it('does not push when QSS rejects the private entry', async () => {
    qssClient.sendMessage.mockResolvedValueOnce({ status: CommunityOperationStatus.ERROR, reason: 'retry later' })
    expect(await manager.sendLogEntrySyncMessage(await messageUpdate())).toBe(false)
    expect(pushCalls()).toEqual([])
  })

  it('does not broadcast entries with missing encryption scope', async () => {
    await manager.sendLogEntrySyncMessage(makeUpdate({ teamId: chain.team!.id, channelId: channel.id }))
    expect(pushCalls()).toEqual([])
  })
})
