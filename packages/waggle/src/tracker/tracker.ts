import express from 'express'
import { Tor } from '../torManager'
import { ZBAY_DIR_PATH } from '../constants'
import * as path from 'path'
import * as os from 'os'
import fs from 'fs'
import { Multiaddr } from 'multiaddr'
import debug from 'debug'
const log = Object.assign(debug('waggle:tracker'), {
  error: debug('waggle:tracker:err')
})

interface IPeer {
  [address: string]: number
}

export class Tracker {
  private readonly _app: express.Application
  private _peers: IPeer
  private readonly _port: number
  private readonly _controlPort: number
  private readonly _socksPort: number
  private readonly _privKey: string
  private readonly _peerExpirationTime: number

  constructor(hiddenServicePrivKey: string, port?: number, controlPort?: number, socksPort?: number, peerExpirationTime?: number) {
    this._app = express()
    this._peers = {}
    this._privKey = hiddenServicePrivKey
    this._port = port || 7788
    this._controlPort = controlPort || 9051
    this._socksPort = socksPort || 9152
    this._peerExpirationTime = peerExpirationTime || 2 * 60 * 60 * 1000
  }

  private async initTor() {
    const torPath = `${process.cwd()}/tor/tor`
    const pathDevLib = path.join.apply(null, [process.cwd(), 'tor'])
    if (!fs.existsSync(ZBAY_DIR_PATH)) {
      fs.mkdirSync(ZBAY_DIR_PATH)
    }
    const tor = new Tor({
      appDataPath: ZBAY_DIR_PATH,
      socksPort: this._socksPort,
      torPath,
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
    return await tor.spawnHiddenService({
      virtPort: this._port,
      targetPort: this._port,
      privKey: this._privKey
    })
  }

  private addPeer(address: string): boolean {
    let maddr: Multiaddr = null
    try {
      maddr = new Multiaddr(address)
    } catch (e) {
      log.error('Wrong address format:', e)
      return false
    }

    const expirationTime = (new Date()).getTime() + this._peerExpirationTime
    this._peers[address] = expirationTime
    log(`Added peer ${maddr.getPeerId()}`)
    return true
  }

  private clearPeers() {
    const now = (new Date()).getTime()
    for (const address of Object.keys(this._peers)) {
      if (now > this._peers[address]) {
        // eslint-disable-next-line
        delete this._peers[address]
      }
    }
  }

  private getAddresses(): string[] {
    return Object.keys(this._peers)
  }

  private setRouting() {
    this._app.use(express.json())
    this._app.get('/peers', (_req, res) => {
      this.clearPeers()
      res.send(this.getAddresses())
    })
    this._app.post('/register', (req, res) => {
      const address = req.body.address
      if (!address) {
        log('No address in request data')
        res.status(400)
      } else if (!this.addPeer(address)) {
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
    return await new Promise(resolve => {
      this._app.listen(this._port, () => {
        log(`Tracker listening on ${this._port}`)
        resolve()
      })
    })
  }
}
