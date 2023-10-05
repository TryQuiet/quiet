import { io, Socket } from 'socket.io-client'
import Websockets from 'libp2p-websockets'
import { PayloadAction } from '@reduxjs/toolkit'
import { all, call, fork, takeEvery } from 'typed-redux-saga'
import { app, connectionsManager } from '@quiet/backend'
import { TestStore, StoreKeys, errors, prepareStore, useIO } from '@quiet/state-manager'
import path from 'path'
import assert from 'assert'
import getPort from 'get-port'
import tmp from 'tmp'
import logger from './logger'
import { Saga, Task } from '@redux-saga/types'

const log = logger('utils')
const backend: any = {}

export const createTmpDir = (prefix: string) => {
  return tmp.dirSync({ mode: 0o750, prefix, unsafeCleanup: true })
}

export const createPath = (dirName: string) => {
  return path.join(dirName, '.state-manager')
}

const connectToDataport = (url: string, name: string): Socket => {
  const socket = io(url)
  socket.on('connect', async () => {
    log(`websocket connection is ready for app ${name}`)
  })
  socket.on('disconnect', () => {
    log(`socket disconnected for app ${name}`)
    socket.close()
  })
  return socket
}

export const createApp = async (
  mockedState?: { [key in StoreKeys]?: any },
  appDataPath?: string
): Promise<{
  store: TestStore
  runSaga: <S extends Saga<any[]>>(saga: S, ...args: Parameters<S>) => Task
  rootTask: Task
  manager: typeof connectionsManager
  appPath: string
}> => {
  /**
   * Configure and initialize ConnectionsManager from backend,
   * configure redux store
   */
  const appName = (Math.random() + 1).toString(36).substring(7)
  log(`Creating test app for ${appName}`)
  const dataServerPort1 = await getPort()

  const { store, runSaga } = prepareStore(mockedState)

  const proxyPort = await getPort()
  const controlPort = await getPort()
  const httpTunnelPort = await getPort()
  const appPath = createPath(createTmpDir(`quietIntegrationTest-${appName}`).name)
  const manager = new backend.ConnectionsManager({
    options: {
      env: {
        appDataPath: appDataPath || appPath,
      },
    },
    socketIOPort: dataServerPort1,
  })
  await manager.init()

  function* root(): Generator {
    const socket = yield* call(connectToDataport, `http://localhost:${dataServerPort1}`, appName)
    yield* fork(useIO, socket)
  }

  const rootTask = runSaga(root)

  return { store, runSaga, rootTask, manager, appPath }
}

export const createAppWithoutTor = async (
  mockedState?: {
    [key in StoreKeys]?: any
  },
  appDataPath?: string
): Promise<{
  store: TestStore
  runSaga: <S extends Saga<any[]>>(saga: S, ...args: Parameters<S>) => Task
  rootTask: Task
  manager:  typeof connectionsManager
  appPath: string
}> => {
  /**
   * Configure and initialize ConnectionsManager from backend,
   * configure redux store
   */
  const appName = (Math.random() + 1).toString(36).substring(7)
  log(`Creating test app for ${appName}`)
  const dataServerPort1 = await getPort()
  const server1 = new backend.DataServer(dataServerPort1)
  await server1.listen()

  const { store, runSaga } = prepareStore(mockedState)

  const socketIOPort = await getPort()

  const appPath = createPath(createTmpDir(`quietIntegrationTest-${appName}`).name)
  const manager = new backend.ConnectionsManager({
    options: {
      env: {
        appDataPath: appDataPath || appPath,
      },
    },
    socketIOPort,
  })

  function* root(): Generator {
    const socket = yield* call(connectToDataport, `http://localhost:${dataServerPort1}`, appName)
    const task = yield* fork(useIO, socket)
  }

  const rootTask = runSaga(root)

  return { store, runSaga, rootTask, manager, appPath }
}

export const sleep = async (time = 1000) =>
  await new Promise<void>(resolve => {
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
  whitelist.forEach(e => {
    MockedState[e] = state[e]
  })
  return MockedState
}
