import IPFS from 'ipfs'
import path from 'path'
import { createPaths } from '../utils'
import OrbitDB from 'orbit-db'
import KeyValueStore from 'orbit-db-kvstore'
import EventStore from 'orbit-db-eventstore'
import PeerId from 'peer-id'
import { message as socketMessage } from '../socket/events/message'
import { loadAllMessages } from '../socket/events/allMessages'
import { EventTypesResponse } from '../socket/constantsReponse'
import fs from 'fs'

export interface IMessage {
  id: string
  type: number
  typeIndicator: number
  message: string
  createdAt: number
  r: number
  channelId: string
  signature: string
}

interface IRepo {
  db: EventStore<IMessage>
}

export interface IChannelInfo {
  name: string
  description: string
  owner: string
  timestamp: number
  address: string
  keys: { ivk?: string; sk?: string }
}

interface ChannelInfoResponse {
  [name: string]: IChannelInfo
}

interface IZbayChannel extends IChannelInfo {
  orbitAddress: string
}

export class Storage {
  zbayDir: string
  constructor(zbayDir: string) {
    this.zbayDir = zbayDir
  }
  
  private ipfs: IPFS.IPFS
  private orbitdb: OrbitDB
  private channels: KeyValueStore<IZbayChannel>
  public repos: Map<String, IRepo> = new Map()

  public async init(libp2p: any, peerID: PeerId): Promise<void> {
    const ipfsRepoPath = path.join(this.zbayDir, 'ZbayChannels')
    const orbitDbDir = path.join(this.zbayDir, 'OrbitDB')
    createPaths([ipfsRepoPath, orbitDbDir])
    this.ipfs = await IPFS.create({
      libp2p: () => libp2p,
      preload: { enabled: false },
      repo: ipfsRepoPath,
      EXPERIMENTAL: {
        ipnsPubsub: true
      },
      // @ts-ignore
      privateKey: peerID.toJSON().privKey 
    })

    this.orbitdb = await OrbitDB.createInstance(this.ipfs, {directory: orbitDbDir})
    await this.createDbForChannels()
    await this.subscribeForAllChannels()
  }

  public async loadInitChannels() {
    // Temp, only for entrynode
    const initChannels: ChannelInfoResponse = JSON.parse(fs.readFileSync('initialPublicChannels.json').toString())
    for (const channel of Object.values(initChannels)) {
      await this.createChannel(channel.address, channel)
    }
  }

  private async createDbForChannels() {
    this.channels = await this.orbitdb.keyvalue<IZbayChannel>('zbay-public-channels', {
      accessController: {
        write: ['*']
      }
    })
    this.channels.events.on('replicated', () => {
      console.log('REPLICATED CHANNELS')
    })
    await this.channels.load()
    console.log('ALL CHANNELS COUNT:', Object.keys(this.channels.all).length)
  }

  async subscribeForAllChannels() {
    for (const channelData of Object.values(this.channels.all)) {
      if (!this.repos.has(channelData.address)) {
        await this.createChannel(channelData.address, channelData)
      }
    }
  }

  private getChannelsResponse(): ChannelInfoResponse {
    let channels: ChannelInfoResponse = {}
    console.log(Object.keys(this.channels.all))
    for (const channel of Object.values(this.channels.all)) {
      if (channel.keys) { // TODO: create proper validators
        channels[channel.name] = {
          address: channel.address,
          description: channel.description,
          owner: channel.owner,
          timestamp: channel.timestamp,
          keys: channel.keys,
          name: channel.name
        }
      }
    }
    return channels
  }

  public async updateChannels(io) {
    /** Update list of available public channels */
    io.emit(EventTypesResponse.RESPONSE_GET_PUBLIC_CHANNELS, this.getChannelsResponse())
  }

  private getAllChannelMessages(db: EventStore<IMessage>): IMessage[] { // TODO: move to e.g custom Store
    return db
      .iterator({ limit: -1 })
      .collect()
      .map(e => e.payload.value)
  }

  public async subscribeForChannel(channelAddress: string, io: any, channelInfo?: IChannelInfo): Promise<void> {
    let db: EventStore<IMessage>
    if (this.repos.has(channelAddress)) {
      db = this.repos.get(channelAddress).db
    } else {
      db = await this.createChannel(channelAddress, channelInfo)
      if (!db) {
        console.log(`Can't subscribe to channel ${channelAddress}`)
        return
      }
    }

    db.events.on('write', (_address, entry) => {
      socketMessage(io, { message: entry.payload.value, channelAddress })
    })
    db.events.on('replicated', () => {
      loadAllMessages(io, this.getAllChannelMessages(db), channelAddress)
    })
    loadAllMessages(io, this.getAllChannelMessages(db), channelAddress)
    console.log('Subscription to channel ready', channelAddress)
  }

  public async sendMessage(channelAddress: string, io: any, message: IMessage) {
    await this.subscribeForChannel(channelAddress, io)
    const db = this.repos.get(channelAddress).db
    db.events.on('write', (address, entry, heads) => {
      console.log('Writing message')
      const all = this.getAllChannelMessages(db)
      console.log(`Count messages in ${entry.id}: ${all.length}`)  
    })
    await db.add(message)
  }

  private async createChannel(channelAddress: string, channelData?: IChannelInfo): Promise<EventStore<IMessage>> {
    if (!channelAddress) {
      console.log(`No channel address, can't create channel`)
      return
    }

    const db: EventStore<IMessage> = await this.orbitdb.log<IMessage>(`zbay.channels.${channelAddress}`, {
      accessController: {
        write: ['*']
      }
    })
    await db.load()

    const channel = this.channels.get(channelAddress)
    if (!channel) {
      await this.channels.put(channelAddress, {
        orbitAddress: `/orbitdb/${db.address.root}/${db.address.path}`,
        address: channelAddress,
        ...channelData
      })
      console.log(`Created channel ${channelAddress}`)
    }
    this.repos.set(channelAddress, { db })
    return db
  }
}
