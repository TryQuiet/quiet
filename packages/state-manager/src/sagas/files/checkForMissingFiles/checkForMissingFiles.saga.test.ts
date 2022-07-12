import { setupCrypto } from '@quiet/identity'
import { communities, getFactory, identity, MessageType, publicChannels } from '../../..'
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

describe('checkForMissingFilesSaga', () => {
  beforeAll(async () => {
    setupCrypto()
  })

  test('download image after restarting the app', async () => {
    const initialState = (await prepareStore()).store

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
      size: 1000
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

    const store = (await prepareStore(initialState.getState())).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
      
    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      connectionActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState({
        ...store.getState(),
        Files: {
          downloadStatus: { 
            ids: [{0: message}], 
            entities:{[message]: {
              mid: missingFile.message.id,
              cid: missingFile.cid,
              downloadState: DownloadState.Downloading
            }}
          }
        }
      })
      .put(filesActions.updateDownloadStatus({
        mid: missingFile.message.id,
        cid: missingFile.cid,
        downloadState: DownloadState.Queued,
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
    const initialState = (await prepareStore()).store

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
      size: 1000
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

    const store = (await prepareStore(initialState.getState())).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
      
    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      connectionActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState({
        ...store.getState(),
        Files: {
          downloadStatus: { 
            ids: [{0: message}], 
            entities:{[message]: {
              mid: missingFile.message.id,
              cid: missingFile.cid,
              downloadState: DownloadState.Downloading
            }}
          }
        }
      })
      .put(filesActions.updateDownloadStatus({
        mid: missingFile.message.id,
        cid: missingFile.cid,
        downloadState: DownloadState.Queued,
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

  test('do notdownload file after restarting the app if file is to large', async () => {
    const initialState = (await prepareStore()).store

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
      size: 100000000000
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

    const store = (await prepareStore(initialState.getState())).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
      
    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      connectionActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState({
        ...store.getState(),
        Files: {
          downloadStatus: { 
            ids: [{0: message}], 
            entities:{[message]: {
              mid: missingFile.message.id,
              cid: missingFile.cid,
              downloadState: DownloadState.Downloading
            }}
          }
        }
      })
      .not.put(filesActions.updateDownloadStatus({
        mid: missingFile.message.id,
        cid: missingFile.cid,
        downloadState: DownloadState.Queued,
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

  test('do not download file after restarting the app if downloading status is canceled', async () => {
    const initialState = (await prepareStore()).store

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
      size: 1000
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

    const store = (await prepareStore(initialState.getState())).store
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
      
    const reducer = combineReducers(reducers)
    await expectSaga(
      checkForMissingFilesSaga,
      socket,
      connectionActions.addInitializedCommunity(community.id)
    )
      .withReducer(reducer)
      .withState({
        ...store.getState(),
        Files: {
          downloadStatus: { 
            ids: [{0: message}], 
            entities:{[message]: {
              mid: missingFile.message.id,
              cid: missingFile.cid,
              downloadState: DownloadState.Canceled
            }}
          }
        }
      })
      .not.put(filesActions.updateDownloadStatus({
        mid: missingFile.message.id,
        cid: missingFile.cid,
        downloadState: DownloadState.Queued,
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
})
