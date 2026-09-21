import { describe, expect, it, jest } from '@jest/globals'
import { type LogEntry } from '@orbitdb/core'
import { type DeviceNetworkEndpoint } from '@quiet/types'
import { base58btc } from 'multiformats/bases/base58'

import { EncryptionScopeType, type EncryptedAndSignedPayload } from '../../auth/services/crypto/types'
import { RoleName } from '../../auth/services/roles/roles'
import { OrbitDbOp } from '../orbitDb/orbitdb.types'
import { NetworkEndpointsAccessController } from './NetworkEndpointsAccessController'

const PEER_ID = '12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx'
const DEVICE_ID = 'writer-device-id'

const emptyAsyncIterable = async function* () {}

const createInMemoryIpfs = () => {
  const blocks = new Map<string, Uint8Array>()
  const cidKey = (cid: any): string => cid.toString(base58btc)
  return {
    blockstore: {
      put: async (cid: any, bytes: Uint8Array) => blocks.set(cidKey(cid), bytes),
      get: async (cid: any) => blocks.get(cidKey(cid)),
    },
    pins: {
      isPinned: async () => false,
      add: () => emptyAsyncIterable(),
    },
  }
}

const endpoint = (overrides: Partial<DeviceNetworkEndpoint> = {}): DeviceNetworkEndpoint => ({
  teamId: 'team-id',
  userId: 'writer-id',
  deviceId: DEVICE_ID,
  onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
  peerId: PEER_ID,
  ...overrides,
})

const encrypted = (overrides: Partial<EncryptedAndSignedPayload> = {}): EncryptedAndSignedPayload =>
  ({
    encrypted: {
      contents: new Uint8Array([1]),
      scope: { type: EncryptionScopeType.ROLE, name: RoleName.MEMBER, generation: 0 },
    },
    signature: { signature: 'signature', author: { name: 'writer-id' } },
    ts: 1,
    userId: 'writer-id',
    teamId: 'team-id',
    ...overrides,
  }) as EncryptedAndSignedPayload

const entry = (
  overrides: Omit<Partial<LogEntry<EncryptedAndSignedPayload>>, 'payload'> & {
    payload?: { op: OrbitDbOp; key: string; value?: EncryptedAndSignedPayload }
  } = {}
): LogEntry<EncryptedAndSignedPayload> =>
  ({
    id: 'network-endpoints-log',
    hash: 'entry-hash',
    identity: 'writer-identity-hash',
    key: 'writer-public-key',
    sig: 'writer-signature',
    next: [],
    refs: [],
    clock: { id: 'writer-public-key', time: 1 },
    v: 2,
    payload: { op: OrbitDbOp.PUT, key: DEVICE_ID, value: encrypted() },
    ...overrides,
  }) as unknown as LogEntry<EncryptedAndSignedPayload>

const createAccess = async ({ active = true, value = endpoint() } = {}) => {
  const team = {
    id: 'team-id',
    hasDevice: jest.fn((deviceId: string) => active && deviceId === DEVICE_ID),
    memberByDeviceId: jest.fn(() => ({ userId: 'writer-id' })),
  }
  const sigchainService = {
    getActiveChain: jest.fn(() => ({
      team,
      crypto: { decryptAndVerify: jest.fn(() => ({ contents: value, isValid: true })) },
    })),
  } as any
  const controller = new NetworkEndpointsAccessController(sigchainService)
  const factory = controller.createAccessControllerFunc({ write: ['*'], sigchainService })
  const access = await (factory as any)({
    orbitdb: { identity: { id: 'local-identity' }, ipfs: createInMemoryIpfs() },
    identities: {
      getIdentity: jest.fn().mockResolvedValue({
        id: 'writer-id',
        teamId: 'team-id',
        deviceId: DEVICE_ID,
        publicKey: 'writer-public-key',
      } as never),
      verifyIdentity: jest.fn().mockResolvedValue(true as never),
      verify: jest.fn().mockResolvedValue(true as never),
    },
  })
  return access
}

describe('NetworkEndpointsAccessController', () => {
  it('allows an active device to write its own endpoint key', async () => {
    const access = await createAccess()
    await expect(access.canAppend(entry())).resolves.toBe(true)
  })

  it('rejects an active device writing another device key', async () => {
    const access = await createAccess()
    await expect(
      access.canAppend(entry({ payload: { op: OrbitDbOp.PUT, key: 'other-device', value: encrypted() } }))
    ).resolves.toBe(false)
  })

  it('rejects writes from a removed device', async () => {
    const access = await createAccess({ active: false })
    await expect(access.canAppend(entry())).resolves.toBe(false)
  })

  it('rejects endpoint deletion', async () => {
    const access = await createAccess()
    await expect(access.canAppend(entry({ payload: { op: OrbitDbOp.DEL, key: DEVICE_ID } }))).resolves.toBe(false)
  })

  it('rejects a payload claiming another device', async () => {
    const access = await createAccess({ value: endpoint({ deviceId: 'other-device' }) })
    await expect(access.canAppend(entry())).resolves.toBe(false)
  })
})
