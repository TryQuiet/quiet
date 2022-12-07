import { setupCrypto } from '@quiet/identity'
import { AUTODOWNLOAD_SIZE_LIMIT, communities, getFactory, identity, MessageType, publicChannels } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { DateTime } from 'luxon'
import { DownloadState, FileMetadata } from '../files.types'
import { checkForMissingFilesSaga } from './checkForMissingFiles.saga'
import { Socket } from 'socket.io-client'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { connectionActions } from '../../appConnection/connection.slice'
import { filesActions } from '../files.slice'
import { networkActions } from '../../network/network.slice'

describe('checkForMissingFilesSaga', () => {
  beforeAll(async () => {
    setupCrypto()
  })

  test('download image after restarting the app', async () => {
    const initialState = prepareStore().store

    const factory = await getFactory(initialState)

    const community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const message = Math.random().toString(36).substr(2.9)
    const channelAddress = 'general'

    const missingFile: FileMetadata = {
      cid: Math.random().toString(36).substr(2.9),
      path: null,
      name: 'test-image',
      ext: '.jpeg',
      message: {
        id: message,
        channelAddress: channelAddress
      },
      size: AUTODOWNLOAD_SIZE_LIMIT - 2048
    }

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message,
          type: MessageType.Image,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'general',
          signature: '',
          pubKey: '',
          media: missingFile
        }
      }
    )

    const store = prepareStore(initialState.getState()).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    store.dispatch(filesActions.updateDownloadStatus({
      mid: missingFile.message.id,
      cid: missingFile.cid,
      downloadState: DownloadState.Downloading
    }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      networkActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(filesActions.updateDownloadStatus({
        mid: missingFile.message.id,
        cid: missingFile.cid,
        downloadState: DownloadState.Queued
      }))
      .apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: missingFile
        }
      ])
      .run()
  })

  test('download file after restarting the app', async () => {
    const initialState = prepareStore().store

    const factory = await getFactory(initialState)

    const community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const message = Math.random().toString(36).substr(2.9)
    const channelAddress = 'general'

    const missingFile: FileMetadata = {
      cid: Math.random().toString(36).substr(2.9),
      path: null,
      name: 'test-file',
      ext: '.zip',
      message: {
        id: message,
        channelAddress: channelAddress
      },
      size: AUTODOWNLOAD_SIZE_LIMIT - 2048
    }

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'general',
          signature: '',
          pubKey: '',
          media: missingFile
        }
      }
    )

    const store = prepareStore(initialState.getState()).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    store.dispatch(filesActions.updateDownloadStatus({
      mid: missingFile.message.id,
      cid: missingFile.cid,
      downloadState: DownloadState.Downloading
    }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      networkActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(filesActions.updateDownloadStatus({
        mid: missingFile.message.id,
        cid: missingFile.cid,
        downloadState: DownloadState.Queued
      }))
      .apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: missingFile
        }
      ])
      .run()
  })

  test('download only specific file from many missing files', async () => {
    const initialState = prepareStore().store

    const factory = await getFactory(initialState)

    const community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const message1 = Math.random().toString(36).substr(2.9)
    const message2 = Math.random().toString(36).substr(2.9)

    const channelAddress = 'general'

    const missingFile1: FileMetadata = {
      cid: Math.random().toString(36).substr(2.9),
      path: null,
      name: 'test-file',
      ext: '.zip',
      message: {
        id: message1,
        channelAddress: channelAddress
      },
      size: AUTODOWNLOAD_SIZE_LIMIT - 2048
    }

    const missingFile2: FileMetadata = {
      cid: Math.random().toString(36).substr(2.9),
      path: null,
      name: 'test-file',
      ext: '.zip',
      message: {
        id: message2,
        channelAddress: channelAddress
      },
      size: AUTODOWNLOAD_SIZE_LIMIT - 2048
    }

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message1,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'general',
          signature: '',
          pubKey: '',
          media: missingFile1
        }
      }
    )

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message2,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'general',
          signature: '',
          pubKey: '',
          media: missingFile2
        }
      }
    )

    const store = prepareStore(initialState.getState()).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    store.dispatch(filesActions.updateDownloadStatus({
      mid: missingFile1.message.id,
      cid: missingFile1.cid,
      downloadState: DownloadState.Canceled
    }))

    store.dispatch(filesActions.updateDownloadStatus({
      mid: missingFile2.message.id,
      cid: missingFile2.cid,
      downloadState: DownloadState.Downloading
    }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      networkActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(filesActions.updateDownloadStatus({
        mid: missingFile1.message.id,
        cid: missingFile1.cid,
        downloadState: DownloadState.Queued
      }))
      .not.apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: missingFile1
        }
      ])
      .put(filesActions.updateDownloadStatus({
        mid: missingFile2.message.id,
        cid: missingFile2.cid,
        downloadState: DownloadState.Queued
      }))
      .apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: missingFile2
        }
      ])
      .run()
  })

  test('do not download file after restarting the app if file exceeds autodownload size limit', async () => {
    const initialState = prepareStore().store

    const factory = await getFactory(initialState)

    const community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const message = Math.random().toString(36).substr(2.9)
    const channelAddress = 'general'

    const missingFile: FileMetadata = {
      cid: Math.random().toString(36).substr(2.9),
      path: null,
      name: 'test-file',
      ext: '.zip',
      message: {
        id: message,
        channelAddress: channelAddress
      },
      size: AUTODOWNLOAD_SIZE_LIMIT + 2048
    }

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'general',
          signature: '',
          pubKey: '',
          media: missingFile
        }
      }
    )

    const store = prepareStore(initialState.getState()).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    store.dispatch(filesActions.updateDownloadStatus({
      mid: missingFile.message.id,
      cid: missingFile.cid,
      downloadState: DownloadState.Ready
    }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      networkActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(filesActions.updateDownloadStatus({
        mid: missingFile.message.id,
        cid: missingFile.cid,
        downloadState: DownloadState.Queued
      }))
      .not.apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: missingFile
        }
      ])
      .run()
  })

  test('resume download after restarting the app even if file exceeds autodownload size limit (download started manually)', async () => {
    const initialState = prepareStore().store

    const factory = await getFactory(initialState)

    const community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const message = Math.random().toString(36).substr(2.9)
    const channelAddress = 'general'

    const missingFile: FileMetadata = {
      cid: Math.random().toString(36).substr(2.9),
      path: null,
      name: 'test-file',
      ext: '.zip',
      message: {
        id: message,
        channelAddress: channelAddress
      },
      size: AUTODOWNLOAD_SIZE_LIMIT + 2048
    }

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'general',
          signature: '',
          pubKey: '',
          media: missingFile
        }
      }
    )

    const store = prepareStore(initialState.getState()).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    store.dispatch(filesActions.updateDownloadStatus({
      mid: missingFile.message.id,
      cid: missingFile.cid,
      downloadState: DownloadState.Downloading
    }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      networkActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(filesActions.updateDownloadStatus({
        mid: missingFile.message.id,
        cid: missingFile.cid,
        downloadState: DownloadState.Queued
      }))
      .apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: missingFile
        }
      ])
      .run()
  })

  test('do not download file after restarting the app if downloading status is canceled', async () => {
    const initialState = prepareStore().store

    const factory = await getFactory(initialState)

    const community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const message = Math.random().toString(36).substr(2.9)
    const channelAddress = 'general'

    const missingFile: FileMetadata = {
      cid: Math.random().toString(36).substr(2.9),
      path: null,
      name: 'test-file',
      ext: '.zip',
      message: {
        id: message,
        channelAddress: channelAddress
      },
      size: AUTODOWNLOAD_SIZE_LIMIT - 2048
    }

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'general',
          signature: '',
          pubKey: '',
          media: missingFile
        }
      }
    )

    const store = (await prepareStore(initialState.getState())).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    store.dispatch(filesActions.updateDownloadStatus({
      mid: missingFile.message.id,
      cid: missingFile.cid,
      downloadState: DownloadState.Canceled
    }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      networkActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(filesActions.updateDownloadStatus({
        mid: missingFile.message.id,
        cid: missingFile.cid,
        downloadState: DownloadState.Queued
      }))
      .not.apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: missingFile
        }
      ])
      .run()
  })

  test('do not download file after restarting the app if downloading status is malicious', async () => {
    const initialState = prepareStore().store

    const factory = await getFactory(initialState)

    const community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const message = Math.random().toString(36).substr(2.9)
    const channelAddress = 'general'

    const missingFile: FileMetadata = {
      cid: Math.random().toString(36).substr(2.9),
      path: null,
      name: 'test-file',
      ext: '.zip',
      message: {
        id: message,
        channelAddress: channelAddress
      },
      size: AUTODOWNLOAD_SIZE_LIMIT - 2048
    }

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'general',
          signature: '',
          pubKey: '',
          media: missingFile
        }
      }
    )

    const store = (await prepareStore(initialState.getState())).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    store.dispatch(filesActions.updateDownloadStatus({
      mid: missingFile.message.id,
      cid: missingFile.cid,
      downloadState: DownloadState.Malicious
    }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      networkActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(filesActions.updateDownloadStatus({
        mid: missingFile.message.id,
        cid: missingFile.cid,
        downloadState: DownloadState.Queued
      }))
      .not.apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: missingFile
        }
      ])
      .run()
  })

  test('do not throw error if download status is not present', async () => {
    const initialState = prepareStore().store

    const factory = await getFactory(initialState)

    const community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const message = Math.random().toString(36).substr(2.9)
    const channelAddress = 'general'

    const missingFile: FileMetadata = {
      cid: Math.random().toString(36).substr(2.9),
      path: null,
      name: 'test-file',
      ext: '.zip',
      message: {
        id: message,
        channelAddress: channelAddress
      },
      size: AUTODOWNLOAD_SIZE_LIMIT - 2048
    }

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'general',
          signature: '',
          pubKey: '',
          media: missingFile
        }
      }
    )

    const store = (await prepareStore(initialState.getState())).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    store.dispatch(filesActions.removeDownloadStatus({
      cid: missingFile.cid
    }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      networkActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(filesActions.updateDownloadStatus({
        mid: missingFile.message.id,
        cid: missingFile.cid,
        downloadState: DownloadState.Queued
      }))
      .apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: missingFile
        }
      ])
      .run()
  })

  it.each([[AUTODOWNLOAD_SIZE_LIMIT + 1], [AUTODOWNLOAD_SIZE_LIMIT - 1024]])('resume downloading for file of any size if it is already in queue (%s)', async (size: number) => {
    const initialState = prepareStore().store

    const factory = await getFactory(initialState)

    const community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const message = Math.random().toString(36).substr(2.9)
    const channelAddress = 'general'
    const missingFile: FileMetadata = {
      cid: Math.random().toString(36).substr(2.9),
      path: null,
      name: 'test-file',
      ext: '.zip',
      message: {
        id: message,
        channelAddress: channelAddress
      },
      size: size
    }

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        message: {
          id: message,
          type: MessageType.File,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'general',
          signature: '',
          pubKey: '',
          media: missingFile
        }
      }
    )

    const store = prepareStore(initialState.getState()).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    store.dispatch(filesActions.updateDownloadStatus({
      mid: missingFile.message.id,
      cid: missingFile.cid,
      downloadState: DownloadState.Queued
    }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      networkActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: alice.peerId.id,
          metadata: missingFile
        }
      ])
      .run()
  })
})
