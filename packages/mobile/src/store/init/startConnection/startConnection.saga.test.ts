import { NativeModules } from 'react-native'
import { SocketEvents } from '@quiet/types'

import { subscribeSocketLifecycle } from './startConnection.saga'
import { initActions, WebsocketConnectionPayload } from '../init.slice'
import { keysActions } from '../../keys/keys.slice'
import { usersMetadataActions } from '../../userMetadata/usersMetadata.slice'

class MockSocket {
  public id = 'socket-1'
  private readonly handlers: Map<string, Set<(...args: any[]) => void>> = new Map()

  public on = jest.fn((event: string, handler: (...args: any[]) => void) => {
    const existing = this.handlers.get(event) ?? new Set()
    existing.add(handler)
    this.handlers.set(event, existing)
    return this
  })

  public off = jest.fn((event: string) => {
    this.handlers.delete(event)
    return this
  })

  public trigger(event: string, ...args: any[]): void {
    for (const handler of this.handlers.get(event) ?? []) {
      void handler(...args)
    }
  }
}

const takeFromChannel = <T>(channel: { take: (callback: (input: T) => void) => void }): Promise<T> =>
  new Promise(resolve => {
    channel.take(resolve)
  })

describe('subscribeSocketLifecycle', () => {
  const socketIOData: WebsocketConnectionPayload = {
    dataPort: 11000,
    socketIOSecret: 'secret',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maps socket lifecycle and NSE events to mobile actions', async () => {
    const socket = new MockSocket()
    const channel = subscribeSocketLifecycle(socket as any, socketIOData)

    const connected = takeFromChannel(channel)
    socket.trigger('connect')
    await expect(connected).resolves.toEqual(initActions.setWebsocketConnected(socketIOData))

    const keysUpdatedPayload = { keys: [{ keyName: 'quiet_team_secret', key: 'secret-key' }] }
    const keysUpdated = takeFromChannel(channel)
    socket.trigger(SocketEvents.KEYS_UPDATED, keysUpdatedPayload)
    await expect(keysUpdated).resolves.toEqual(keysActions.saveKeysInKeychain(keysUpdatedPayload))

    const credentialsPayload = {
      deviceId: 'device-id',
      teamId: 'team-id',
      signingPrivateKey: 'private-signing-key',
    }
    const credentialsUpdated = takeFromChannel(channel)
    socket.trigger(SocketEvents.DEVICE_CREDENTIALS_UPDATED, credentialsPayload)
    await expect(credentialsUpdated).resolves.toEqual(keysActions.saveDeviceCredentials(credentialsPayload))

    const userProfilesPayload = {
      new: [{ userId: 'new-user', nickname: 'Alice' }],
      updates: [{ userId: 'updated-user', nickname: 'Bob' }],
    }
    const userProfilesUpdated = takeFromChannel(channel)
    socket.trigger(SocketEvents.USER_PROFILES_UPDATED, userProfilesPayload)
    await expect(userProfilesUpdated).resolves.toEqual(
      usersMetadataActions.saveUserMetadataNatively(userProfilesPayload)
    )

    const disconnected = takeFromChannel(channel)
    socket.trigger('disconnect', 'transport close')
    await expect(disconnected).resolves.toEqual(initActions.suspendWebsocketConnection())

    channel.close()
  })

  it('stores NSE QSS url and sync seq in native shared storage', async () => {
    const socket = new MockSocket()
    const channel = subscribeSocketLifecycle(socket as any, socketIOData)

    socket.trigger(SocketEvents.NSE_QSS_URL_UPDATED, {
      teamId: 'team-id',
      qssUrl: 'https://community.example',
    })
    await Promise.resolve()

    expect(NativeModules.CommunicationModule.saveNseQssUrl).toHaveBeenCalledWith('team-id', 'https://community.example')

    socket.trigger(SocketEvents.NSE_SYNC_SEQ_UPDATED, {
      teamId: 'team-id',
      lastSyncSeq: 42,
    })
    await Promise.resolve()

    expect(NativeModules.CommunicationModule.saveNseLastSyncSeq).toHaveBeenCalledWith('team-id', 42)

    channel.close()
  })

  it('unsubscribes all registered listeners when the channel closes', () => {
    const socket = new MockSocket()
    const channel = subscribeSocketLifecycle(socket as any, socketIOData)

    channel.close()

    expect(socket.off).toHaveBeenCalledWith('connect')
    expect(socket.off).toHaveBeenCalledWith('disconnect')
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.KEYS_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.DEVICE_CREDENTIALS_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.USER_PROFILES_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.NSE_QSS_URL_UPDATED)
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.NSE_SYNC_SEQ_UPDATED)
  })
})
