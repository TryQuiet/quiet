import { io, Socket } from 'socket.io-client'
import Websockets from 'libp2p-websockets'
import { PayloadAction } from '@reduxjs/toolkit'
import { all, call, fork, takeEvery } from 'typed-redux-saga'
import waggle, { ConnectionsManager } from '@quiet/waggle'
import { Store, StoreKeys, errors, prepareStore, useIO } from '@quiet/nectar'
import path from 'path'
import assert from 'assert'
import getPort from 'get-port'
import tmp from 'tmp'
import logger from './logger'
import { Saga, Task } from '@redux-saga/types'

const log = logger('utils')

export const createTmpDir = (prefix: string) => {
  return tmp.dirSync({ mode: 0o750, prefix, unsafeCleanup: true })
}

export const createPath = (dirName: string) => {
  return path.join(dirName, '.nectar')
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

export const createApp = async (mockedState?: { [key in StoreKeys]?: any }, appDataPath?: string): Promise<{
  store: Store
  runSaga: <S extends Saga<any[]>>(saga: S, ...args: Parameters<S>) => Task
  rootTask: Task
  manager: ConnectionsManager
  appPath: string
}> => {
  /**
   * Configure and initialize ConnectionsManager from waggle,
   * configure redux store
   */
  const appName = (Math.random() + 1).toString(36).substring(7)
  log(`Creating test app for ${appName}`)
  const dataServerPort1 = await getPort({ port: 4677 })
  const server1 = new waggle.DataServer(dataServerPort1)
  await server1.listen()

  const { store, runSaga } = prepareStore(mockedState)

  const proxyPort = await getPort({ port: 1234 })
  const controlPort = await getPort({ port: 5555 })
  const httpTunnelPort = await getPort({ port: 9000 })
  const appPath = createPath(createTmpDir(`quietIntegrationTest-${appName}`).name)
  const manager = new waggle.ConnectionsManager({
    agentHost: 'localhost',
    agentPort: proxyPort,
    httpTunnelPort,
    options: {
      env: {
        appDataPath: appDataPath || appPath
      },
      torControlPort: controlPort
    },
    io: server1.io
  })
  await manager.init()

  function* root(): Generator {
    const socket = yield* call(connectToDataport, `http://localhost:${dataServerPort1}`, appName)
    // @ts-expect-error
    yield* fork(useIO, socket)
  }

  const rootTask = runSaga(root)

  return { store, runSaga, rootTask, manager, appPath }
}

export const createAppWithoutTor = async (mockedState?: {
  [key in StoreKeys]?: any
}, appDataPath?: string): Promise<{
    store: Store
    runSaga: <S extends Saga<any[]>>(saga: S, ...args: Parameters<S>) => Task
    rootTask: Task
    manager: ConnectionsManager
    appPath: string
  }> => {
  /**
   * Configure and initialize ConnectionsManager from waggle,
   * configure redux store
   */
  const appName = (Math.random() + 1).toString(36).substring(7)
  log(`Creating test app for ${appName}`)
  const dataServerPort1 = await getPort({ port: 4677 })
  const server1 = new waggle.DataServer(dataServerPort1)
  await server1.listen()

  const { store, runSaga } = prepareStore(mockedState)

  const proxyPort = await getPort({ port: 1234 })
  const controlPort = await getPort({ port: 5555 })
  const httpTunnelPort = await getPort({ port: 9000 })
  const appPath = createPath(createTmpDir(`quietIntegrationTest-${appName}`).name)
  const manager = new waggle.ConnectionsManager({
    agentHost: 'localhost',
    agentPort: proxyPort,
    httpTunnelPort,
    options: {
      env: {
        appDataPath: appDataPath || appPath
      },
      libp2pTransportClass: Websockets,
      torControlPort: controlPort
    },
    io: server1.io
  })
  manager.initListeners()

  function* root(): Generator {
    const socket = yield* call(connectToDataport, `http://localhost:${dataServerPort1}`, appName)
    // @ts-expect-error
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
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}