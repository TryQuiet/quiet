import express from 'express'
import { createServer, Server } from 'http'
import { Tor } from 'tor-manager'
import * as path from 'path'
import * as os from 'os'
import fs from 'fs'
import PeerId from 'peer-id'
import { ConnectionsManager } from '../connectionsManager'
import { Git } from '../../git/index'
import initListeners from './listeners'
import { sleep } from '../sleep'
const socketio = require('socket.io')
const cors = require('cors')
import { loadAllMessages } from '../socket/events/allMessages'

export class DataServer {
  public PORT: number = 3000
  private _app: express.Application
  private server: Server
  private io: SocketIO.Server
  public connectonsManager: ConnectionsManager
  public git: Git
  public tor: Tor
  public libp2p: ConnectionsManager
  public libp2pAddress: string
  public repositoryAddress: string
  public messages: any
  
  constructor() {
    this._app = express()
    this.server = createServer(this._app)
    this.git = new Git()
    this.initSocket()
  }

  private initSocket = (): void => {
    this.io = socketio(this.server, {
      cors: {
        orgins: ["null"],
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
      }})
  }

  public initGit = async (): Promise<void> => {
    await this.git.init()
    await this.git.createRepository('test-address')
    this.messages = await this.git.loadAllMessages('test-address')
    await this.git.spawnGitDaemon()
  }

  public initTor = async (): Promise<void> => {
    const torPath = `${process.cwd()}/tor/tor`
    const settingsPath = `${process.cwd()}/tor/torrc`
    const pathDevLib = path.join.apply(null, [process.cwd(), 'tor'])
    this.tor = new Tor({ torPath, settingsPath, options: {
      env: {
        LD_LIBRARY_PATH: pathDevLib,
        HOME: os.homedir()
      }
    } })
    await this.tor.init()
    let address1
    let address3
    try {
      address1 = await this.tor.getServiceAddress(7788)
      address3 = await this.tor.getServiceAddress(9418)
    } catch (e) {
      await this.tor.addService({ port: 7788 })
      await this.tor.addService({ port: 9418 })
    }
    address1 = await this.tor.getServiceAddress(7788)
    address3 = await this.tor.getServiceAddress(9418)
    this.libp2pAddress = address1
    this.repositoryAddress = address3
  }

  public listen = (): void => {
    this.server.listen(this.PORT, () => {
      console.debug(`Server running on port ${this.PORT}`)
    })
    initListeners(this.io, this.connectonsManager, this.git)
  }

  public initializeLibp2p = async () => {
    const peerId1 = fs.readFileSync('peerId1.json')
    // const peerId2 = fs.readFileSync('../../peerId2.json')
    // const parsedId1 = JSON.parse(peerId1.toString()) as PeerId.JSONPeerId
    // const parsedId2 = JSON.parse(peerId2.toString()) as PeerId.JSONPeerId
    // const peerId1Restored = await PeerId.createFromJSON(parsedId1)
    // const peerId2Restored = await PeerId.createFromJSON(parsedId2)
    this.connectonsManager = new ConnectionsManager({ port: 7788, host: this.libp2pAddress, agentHost: 'localhost', agentPort: 9050 })
    const node = await this.connectonsManager.initializeNode()
    console.log(node, 'node')
    await this.connectonsManager.subscribeForTopic({topic: '/libp2p/example/chat/1.0.0', channelAddress: 'test-address', git: this.git, io: this.io })
    const peerIdOnionAddress = await this.connectonsManager.createOnionPeerId(node.peerId)
    const key = new TextEncoder().encode(this.repositoryAddress)
    await this.connectonsManager.publishOnionAddress(peerIdOnionAddress, key)
    // await sleep(0.5 * 60000)
    // console.log('start sending')
    // await this.connectonsManager.startSendingMessages('test-address', this.git)
    // console.log('sending done')
  }
}
