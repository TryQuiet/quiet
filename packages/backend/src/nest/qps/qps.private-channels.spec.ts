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

describe('message-only push notifications after QSS sync', () => {
  let chain: SigChain
  let channel: PublicChannel
  let sigChainService: SigChainService
  let manager: QSSSyncManager
  let qps: QPSService
  let qssClient: any
  let pending: Record<string, string[]>
  let updates: Map<string, LogUpdate>

  const privateUcans = ['owner-phone', 'member-phone', 'member-tablet']
  const allUcans = [...privateUcans, 'outsider-phone']
  const messageExamples = [
    { type: MessageType.Basic, message: 'Hello everyone' },
    { type: MessageType.Image, message: 'photo.png' },
    { type: MessageType.File, message: 'notes.pdf' },
    { type: MessageType.Info, message: 'Created #private-channel' },
  ]

  const addMember = () => {
    const invite = chain.invites.createUserInvite()
    const invitee = SigChain.createFromInvite({ seed: invite.seed }, chain.team!.id)
    chain.invites.admitMemberFromInvite(
      InviteService.createMemberAdmission({ seed: invite.seed, context: invitee.context })
    )
    return invitee.user.userId
  }

  const makeUpdate = (value: unknown, op: string = OrbitDbOp.PUT, key?: string | null): LogUpdate => {
    const hash = `entry-${updates.size}`
    const update = {
      teamId: chain.team!.id,
      id: 'channel-db-id',
      addr: 'channel-db-address',
      hash,
      entry: { id: 'channel-db-id', hash, payload: { op, key: key === undefined ? hash : key, value } },
    } as unknown as LogUpdate
    updates.set(hash, update)
    return update
  }

  const messageUpdate = async (
    isPublic = false,
    {
      type = MessageType.Basic,
      message: text = 'Hello everyone',
    }: Partial<Pick<ChannelMessage, 'type' | 'message'>> = {}
  ) => {
    const id = `message-${updates.size}`
    const message: ChannelMessage = {
      id,
      channelId: channel.id,
      userId: chain.user.userId,
      message: text,
      type,
      createdAt: Date.now(),
      ...(type === MessageType.Image || type === MessageType.File
        ? {
            media: {
              cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3rneevh2d5oa4sdh5xj5r6z2a',
              message: { id, channelId: channel.id },
              path: null,
              name: 'attachment',
              ext: type === MessageType.Image ? '.png' : '.pdf',
              size: 1024,
              enc: {
                header: Buffer.alloc(24, 1).toString('base64url'),
                recipient: { generation: 0, type: 'ROLE', name: isPublic ? RoleName.MEMBER : channel.roleName! },
              },
              ...(type === MessageType.Image ? { width: 32, height: 32 } : {}),
            },
          }
        : {}),
    }
    const service = isPublic
      ? new PublicChannelMessagesService(sigChainService)
      : new PrivateChannelMessagesService(sigChainService)
    return makeUpdate(
      await service.onSend(message, isPublic ? { ...channel, public: true, roleName: undefined } : channel),
      'ADD',
      null
    )
  }

  // These stores use the same encryptAndSign envelope, unlike channel messages'
  // separate channelId/contents envelope produced by the message services above.
  const nonMessageUpdates = () => {
    const metadata = (isPublic: boolean) =>
      makeUpdate(
        chain.crypto.encryptAndSign(isPublic ? { ...channel, public: true, roleName: undefined } : channel, {
          type: EncryptionScopeType.ROLE,
          name: isPublic ? RoleName.MEMBER : channel.roleName,
        }),
        OrbitDbOp.PUT,
        channel.id
      )
    const memberEntry = (value: unknown) =>
      makeUpdate(chain.crypto.encryptAndSign(value, { type: EncryptionScopeType.ROLE, name: RoleName.MEMBER }))
    return [
      metadata(true),
      metadata(false),
      makeUpdate(null, OrbitDbOp.DEL, 'public-channel-id'),
      makeUpdate(null, OrbitDbOp.DEL, channel.id),
      memberEntry({ userId: chain.user.userId, nickname: 'Alice' }),
      memberEntry({ userId: chain.user.userId, tokens: ['owner-phone'] }),
      memberEntry({ userId: chain.user.userId, tokens: [] }),
    ]
  }

  const syncCalls = () =>
    qssClient.sendMessage.mock.calls.filter(
      ([event]: [WebsocketEvents, unknown, boolean]) => event === WebsocketEvents.LOG_ENTRY_SYNC
    )

  const expectSynced = (expected: LogUpdate[]) => {
    expect(syncCalls()).toHaveLength(expected.length)
    expect(
      syncCalls().map(([_event, sync, withAck]: [WebsocketEvents, any, boolean]) => {
        expect(withAck).toBe(true)
        const { encrypted, signature } = sync.payload.encEntry
        return chain.crypto.decryptAndVerify<LogUpdate['entry']>(encrypted, signature).contents
      })
    ).toEqual(expected.map(update => update.entry))
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
    qps = new QPSService(true, socketService as any, qssClient, new EventEmitter() as any, manager, sigChainService, {
      getAllEntries: async () => [
        { userId: chain.user.userId, tokens: ['owner-phone'] },
        { userId: memberId, tokens: ['member-phone', 'member-tablet'] },
        { userId: outsiderId, tokens: ['outsider-phone'] },
      ],
    } as any)
    qps.onModuleInit()
  })

  afterEach(() => manager.close())

  it.each(messageExamples)(
    'notifies only private channel members for message type $type despite team-wide transport encryption',
    async example => {
      await manager.sendLogEntrySyncMessage(await messageUpdate(false, example))

      const sync = qssClient.sendMessage.mock.calls[0][1]
      expect(sync.payload.encEntry.encrypted.scope.name).toBe(RoleName.MEMBER)
      await expectRecipients(privateUcans)
    }
  )

  it.each(messageExamples)('continues notifying all community members for public message type $type', async example => {
    await manager.sendLogEntrySyncMessage(await messageUpdate(true, example))
    await expectRecipients(allUcans)
  })

  it('syncs metadata, profiles, and device tokens without invoking the push handler', async () => {
    const entries = nonMessageUpdates()
    const pushHandler = jest.spyOn(qps, 'sendBatchPush')
    for (const update of entries) {
      expect(await manager.sendLogEntrySyncMessage(update)).toBe(true)
      await expect(manager.waitForLogEntrySyncAck(update.hash)).resolves.toBeUndefined()
    }

    expectSynced(entries)
    expect(pushHandler).not.toHaveBeenCalled()
    expect(pushCalls()).toEqual([])
  })

  it.each(['online', 'offline retry'])('syncs a private-channel deletion without notifying anyone (%s)', async mode => {
    // OrbitDB deletions contain a null value, with no private-channel encryption scope.
    const update = makeUpdate(null, OrbitDbOp.DEL, channel.id)
    const pushHandler = jest.spyOn(qps, 'sendBatchPush')

    if (mode === 'offline retry') {
      qssClient.connected = false
      await manager.sendLogEntrySyncMessage(update)
      expect(pending).toEqual({ [update.addr]: [update.hash] })
      expect(qssClient.sendMessage).not.toHaveBeenCalled()
      expect(pushHandler).not.toHaveBeenCalled()

      qssClient.connected = true
      manager.markTeamStorageReady(chain.team!.id)
      await waitForExpect(() => expect(pending).toEqual({}))
    } else {
      expect(await manager.sendLogEntrySyncMessage(update)).toBe(true)
    }

    expect(pushHandler).not.toHaveBeenCalled()

    // The deletion still syncs successfully; neither members nor outsiders receive a push.
    expect(qssClient.sendMessage).toHaveBeenCalledTimes(1)
    const [event, sync, withAck] = qssClient.sendMessage.mock.calls[0]
    expect(event).toBe(WebsocketEvents.LOG_ENTRY_SYNC)
    expect(withAck).toBe(true)
    const { encrypted, signature } = sync.payload.encEntry
    const entry = chain.crypto.decryptAndVerify<LogUpdate['entry']>(encrypted, signature).contents
    expect(entry.payload).toEqual({ op: OrbitDbOp.DEL, key: channel.id, value: null })
    expect(pushCalls()).toEqual([])
  })

  it('triggers only the creation info message when a public channel is created', async () => {
    const metadata = nonMessageUpdates()[0]
    const infoMessage = await messageUpdate(true, { type: MessageType.Info, message: `Created #${channel.name}` })
    await manager.sendLogEntrySyncMessage(metadata)
    await manager.sendLogEntrySyncMessage(infoMessage)

    expectSynced([metadata, infoMessage])
    await expectRecipients(allUcans)
  })

  it('replays a mixed offline queue without duplicate pushes from concurrent retry requests', async () => {
    const entries = nonMessageUpdates()
    const privateMessage = await messageUpdate()
    const publicMessage = await messageUpdate(true, { type: MessageType.Info, message: `Created #${channel.name}` })
    entries.splice(1, 0, privateMessage)
    entries.push(publicMessage)

    qssClient.connected = false
    for (const update of entries) {
      await manager.sendLogEntrySyncMessage(update)
    }
    expect(qssClient.sendMessage).not.toHaveBeenCalled()
    expect(pending).toEqual({ [entries[0].addr]: entries.map(update => update.hash) })

    let acknowledge!: (value: unknown) => void
    qssClient.sendMessage.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          acknowledge = resolve
        })
    )
    qssClient.connected = true
    manager.markTeamStorageReady(chain.team!.id)
    await waitForExpect(() => expect(acknowledge).toBeDefined())
    // A readiness event can request another retry while the first upload is awaiting its ack.
    await manager.processDeadLetterQueue(chain.team!.id)
    acknowledge({ status: CommunityOperationStatus.SUCCESS, payload: {} })

    await waitForExpect(() => expect(pending).toEqual({}))
    await manager.processDeadLetterQueue(chain.team!.id)
    expectSynced(entries)
    await waitForExpect(() => {
      expect(pushCalls().map(([_event, push]: [WebsocketEvents, any]) => push.payload.ucans)).toEqual([
        privateUcans,
        allUcans,
      ])
    })
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

  it.each([{ status: CommunityOperationStatus.ERROR, reason: 'retry later' }, undefined])(
    'queues the message without pushing when QSS does not acknowledge success (%s)',
    async response => {
      const update = await messageUpdate()
      const pushHandler = jest.spyOn(qps, 'sendBatchPush')
      qssClient.sendMessage.mockResolvedValueOnce(response)
      expect(await manager.sendLogEntrySyncMessage(update)).toBe(false)
      expect(pushHandler).not.toHaveBeenCalled()
      expect(pushCalls()).toEqual([])
      expect(pending).toEqual({ [update.addr]: [update.hash] })
    }
  )

  it('does not broadcast entries with missing encryption scope', async () => {
    const pushHandler = jest.spyOn(qps, 'sendBatchPush')
    await manager.sendLogEntrySyncMessage(makeUpdate({ teamId: chain.team!.id, channelId: channel.id }, 'ADD', null))
    expect(pushHandler).not.toHaveBeenCalled()
    expect(pushCalls()).toEqual([])
  })
})
