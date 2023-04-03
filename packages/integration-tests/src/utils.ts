import { io, Socket } from 'socket.io-client'
import Websockets from 'libp2p-websockets'
import { PayloadAction } from '@reduxjs/toolkit'
import { all, call, fork, takeEvery } from 'typed-redux-saga'
import { TestStore, StoreKeys, errors, prepareStore, useIO } from '@quiet/state-manager'
import path from 'path'
import assert from 'assert'
import getPort from 'get-port'
import tmp from 'tmp'
// import logger from './logger'
import { Saga, Task } from '@redux-saga/types'
import backend, { ConnectionsManager, torBinForPlatform, torDirForPlatform } from '@quiet/backend'
// import { peerIdFromKeys } from '@libp2p/peer-id'

// const log = logger('utils')

export const createTmpDir = (prefix: string) => {
  return tmp.dirSync({ mode: 0o750, prefix, unsafeCleanup: true })
}

export const createPath = (dirName: string) => {
  return path.join(dirName, '.state-manager')
}

const connectToDataport = (url: string, name: string): Socket => {
  const socket = io(url)
  socket.on('connect', async () => {
    console.log('ELLLO CONNECT')
    // log(`websocket connection is ready for app ${name}`)
  })
  socket.on('disconnect', () => {
    // log(`socket disconnected for app ${name}`)
    socket.close()
  })
  return socket
}

export const createApp = async (
  mockedState?: { [key in StoreKeys]?: any },
  appDataPath?: string
): Promise<{
  store: any
  runSaga: <S extends Saga<any[]>>(saga: S, ...args: Parameters<S>) => Task
  rootTask: Task
  manager: ConnectionsManager
  appPath: string
}> => {
  /**
   * Configure and initialize ConnectionsManager from backend,
   * configure redux store
   */
  const appName = (Math.random() + 1).toString(36).substring(7)
  // log(`Creating test app for ${appName}`)
  const dataServerPort1 = await getPort()

  const { store, runSaga } = prepareStore(mockedState)

  const appPath = createPath(createTmpDir(`quietIntegrationTest-${appName}`).name)
  const manager = new backend.ConnectionsManager({
    options: {
      env: {
        appDataPath: appDataPath || appPath
        // httpTunnelPort: httpTunnelPort
      }
    },
    torBinaryPath: torBinForPlatform(null),
    torResourcesPath: torDirForPlatform(null),
    socketIOPort: dataServerPort1
  })
  await manager.init()
  function* root(): Generator {
    const socket = yield* call(connectToDataport, `http://localhost:${dataServerPort1}`, appName)
    // @ts-expect-error
    yield* fork(useIO, socket)
  }

  const rootTask = runSaga(root)

  // wait for tor
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 15000))

  return { store, runSaga, rootTask, manager, appPath }
}

export const createAppWithoutTor = async (
  mockedState?: {
    [key in StoreKeys]?: any
  },
  appDataPath?: string
): Promise<{
  store: any
  runSaga: <S extends Saga<any[]>>(saga: S, ...args: Parameters<S>) => Task
  rootTask: Task
  manager: ConnectionsManager
  appPath: string
}> => {
  /**
   * Configure and initialize ConnectionsManager from backend,
   * configure redux store
   */
  const appName = (Math.random() + 1).toString(36).substring(7)
  // log(`Creating test app for ${appName}`)
  const dataServerPort1 = await getPort()
  const server1 = new backend.DataServer(dataServerPort1)
  await server1.listen()

  const { store, runSaga } = prepareStore(mockedState)

  const socketIOPort = await getPort()

  const appPath = createPath(createTmpDir(`quietIntegrationTest-${appName}`).name)
  const manager = new backend.ConnectionsManager({
    options: {
      env: {
        appDataPath: appDataPath || appPath
      }
    },
    socketIOPort
  })

  function* root(): Generator {
    const socket = yield* call(connectToDataport, `http://localhost:${dataServerPort1}`, appName)
    // @ts-expect-error
    const task = yield* fork(useIO, socket)
  }

  const rootTask = runSaga(root)

  return { store, runSaga, rootTask, manager, appPath }
}

export const sleep = async (time = 1000) =>
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, time)
  })

export const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min)
}

const whitelist = ['Communities', 'Identity', 'Users', 'PublicChannels', 'Messages', 'Connection']

export const storePersistor = (state: { [key in StoreKeys]?: any }) => {
  const MockedState = {}
  whitelist.forEach((e) => {
    MockedState[e] = state[e]
    if (e === 'Connection') {
      MockedState[e] = {
        ...state[e],
        torBootstrapProcess: 'Bootstrapped 5% (conn)',
        torConnectionProcess: {
          number: 5,
          text: 'Connecting process started'
        }
      }
    }
  })
  return MockedState
}
