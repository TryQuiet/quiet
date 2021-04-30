import express from 'express'
import { Tor } from '../torManager'
import {ZBAY_DIR_PATH} from '../constants'
import * as path from 'path'
import * as os from 'os'
import fs from 'fs'
import multiaddr from 'multiaddr'

interface IPeer {
  [address: string]: number
}

export class Tracker {
  private _app: express.Application
  private _peers: IPeer
  private _port: number
  private _controlPort: number
  private _privKey: string
  private _peerExpirationTime: number

  constructor(hiddenServicePrivKey: string, port?: number, controlPort?: number, peerExpirationTime?: number) {
    this._app = express()
    this._peers = {}
    this._privKey = hiddenServicePrivKey
    this._port = port || 7788
    this._controlPort = controlPort || 9051
    this._peerExpirationTime = peerExpirationTime || 2 * 60 * 60 * 1000
  }

  private async initTor() {
    const torPath = `${process.cwd()}/tor/tor`
    const pathDevLib = path.join.apply(null, [process.cwd(), 'tor'])
    if(!fs.existsSync(ZBAY_DIR_PATH)) {
      fs.mkdirSync(ZBAY_DIR_PATH)
    }
    const tor = new Tor({
      torPath,
      appDataPath: ZBAY_DIR_PATH,
      controlPort: this._controlPort,
      options: {
        env: {
          LD_LIBRARY_PATH: pathDevLib,
          HOME: os.homedir()
        },
        detached: true
      }
    })
    
    await tor.init()
    return await tor.addOnion({ 
      virtPort: this._port, 
      targetPort: this._port, 
      privKey: this._privKey 
    })
  }

  private addPeer(address: string): boolean {
    let maddr = null
    try {
      maddr = multiaddr(address)
    } catch (e) {
      console.debug('Wrong address format:', e)
      return false
    }
    
    const expirationTime = (new Date()).getTime() + this._peerExpirationTime
    this._peers[address] = expirationTime
    console.log(`Added peer ${maddr.getPeerId()}`)
    return true
  }

  private clearPeers() {
    const now = (new Date()).getTime()
    for (const address of Object.keys(this._peers)) {
      if (now > this._peers[address]) {
        delete this._peers[address]
      }
    }
  }

  private getAddresses(): string[] {
    return Object.keys(this._peers)
  }

  private setRouting() {
    this._app.use(express.json())
    this._app.get('/peers', (req, res) => {
      this.clearPeers()
      res.send(this.getAddresses())
    })
    this._app.post('/register',(req, res) => {
      const address = req.body['address']
      if (!address) {
        console.debug('No address in request data')
        res.status(400)
      }
      else if (!this.addPeer(address)) {
        res.status(400)
      }
      res.end()
    })
  }

  public async init() {
    await this.initTor()
    this.setRouting()
  }

  public async listen(): Promise<void> {
    return new Promise(resolve => {
      this._app.listen(this._port, () => {
        console.debug(`Tracker listening on ${this._port}`)
        resolve()
      })
    })  
  }

}
