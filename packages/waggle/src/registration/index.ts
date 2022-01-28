import { createUserCert, UserCert, loadCSR, CertFieldsTypes, getReqFieldValue } from '@quiet/identity'
import { SaveCertificatePayload, PermsData } from '@quiet/nectar'
import { IsBase64, IsNotEmpty, validate } from 'class-validator'
import express, { Request, Response } from 'express'
import getPort from 'get-port'
import { Server } from 'http'

import logger from '../logger'
import { Storage } from '../storage'
import { Tor } from '../torManager'
import { CsrContainsFields, IsCsr } from './validators'
const log = logger('registration')

class UserCsrData {
  @IsNotEmpty()
  @IsBase64()
  @IsCsr()
  @CsrContainsFields()
  csr: string
}

export class CertificateRegistration {
  private readonly _app: express.Application
  private _server: Server
  private _port: number
  private _privKey: string
  private readonly tor: Tor
  private readonly _storage: Storage
  private _onionAddress: string
  private readonly _permsData: PermsData

  constructor(
    tor: Tor,
    storage: Storage,
    permsData: PermsData,
    hiddenServicePrivKey?: string,
    port?: number
  ) {
    this._app = express()
    this._privKey = hiddenServicePrivKey
    this._port = port
    this._storage = storage
    this.tor = tor
    this._onionAddress = null
    this._permsData = permsData
    this.setRouting()
  }

  private setRouting() {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore
    this._app.use(express.json())
    // eslint-disable-next-line
    this._app.post(
      '/register',
      async (req, res): Promise<void> => await this.registerUser(req, res)
    )
  }

  public getHiddenServiceData() {
    if (this.tor) {
      return {
        privateKey: this._privKey,
        onionAddress: this._onionAddress.split('.')[0]
      }
    }
    return {
      privateKey: this._privKey,
      onionAddress: this._onionAddress,
      port: this._port
    }
  }

  public async saveOwnerCertToDb(userCert: string) {
    const payload: SaveCertificatePayload = {
      certificate: userCert,
      rootPermsData: this._permsData
    }
    const certSaved = await this._storage.saveCertificate(payload)
    if (!certSaved) {
      throw new Error('Could not save certificate')
    }
    log('Saved owner certificate')
    return userCert
  }

  static async registerOwnerCertificate(userCsr: string, permsData: PermsData) {
    const userData = new UserCsrData()
    userData.csr = userCsr
    const validationErrors = await validate(userData)
    if (validationErrors.length > 0) return
    const userCert = await createUserCert(
      permsData.certificate,
      permsData.privKey,
      userCsr,
      new Date(),
      new Date(2030, 1, 1)
    )
    return userCert.userCertString
  }

  public async getPeers(): Promise<string[]> {
    const users = this._storage.getAllUsers()
    const peers = users.map(async (userData: { onionAddress: string; peerId: string }) => {
      let port: number
      let ws: string
      if (this.tor) {
        port = 443
        ws = 'wss'
      } else {
        port = 7788 // make sure this port is free
        ws = 'ws'
      }
      return `/dns4/${userData.onionAddress}/tcp/${port}/${ws}/p2p/${userData.peerId}/`
    })

    return await Promise.all(peers)
  }

  private async registerUser(req: Request, res: Response): Promise<void> {
    const userData = new UserCsrData()
    userData.csr = req.body.data
    const validationErrors = await validate(userData)
    if (validationErrors.length > 0) {
      log.error(`Received data is not valid: ${validationErrors.toString()}`)
      res.status(400).send(JSON.stringify(validationErrors))
      return
    }

    const parsedCsr = await loadCSR(userData.csr)
    const username = getReqFieldValue(parsedCsr, CertFieldsTypes.nickName)
    const usernameExists = this._storage.usernameExists(username)
    if (usernameExists) {
      log(`Username ${username} is taken`)
      res.status(403).send()
      return
    }

    let cert: UserCert
    try {
      cert = await this.registerCertificate(userData.csr)
    } catch (e) {
      log.error(`Something went wrong with registering user: ${e.message as string}`)
      res.status(400).send()
      return
    }
    res.send({
      certificate: cert.userCertString,
      peers: await this.getPeers(),
      rootCa: this._permsData.certificate
    })
  }

  private async registerCertificate(userCsr: string): Promise<UserCert> {
    const userCert = await createUserCert(
      this._permsData.certificate,
      this._permsData.privKey,
      userCsr,
      new Date(),
      new Date(2030, 1, 1)
    )
    const certSaved = await this._storage.saveCertificate({
      certificate: userCert.userCertString,
      rootPermsData: this._permsData
    })
    if (!certSaved) {
      throw new Error('Could not save certificate')
    }
    log('Saved certificate')
    return userCert
  }

  public async init() {
    if (!this._port) {
      const port = await getPort({ port: 7789 })
      this._port = port
    }
    if (this._privKey) {
      if (this.tor) {
        this._onionAddress = await this.tor.spawnHiddenService({
          virtPort: 80,
          targetPort: this._port,
          privKey: this._privKey
        })
      } else {
        this._onionAddress = '0.0.0.0'
      }
    } else {
      let data
      if (this.tor) {
        data = await this.tor.createNewHiddenService(80, this._port)
      } else {
        data = {
          onionAddress: '0.0.0.0',
          privateKey: ''
        }
      }
      this._onionAddress = data.onionAddress
      this._privKey = data.privateKey
    }
  }

  public async listen(): Promise<void> {
    return await new Promise(resolve => {
      this._server = this._app.listen(this._port, () => {
        log(`Certificate registration service listening on ${this._onionAddress}:${this._port}`)
        resolve()
      })
    })
  }

  public async stop(): Promise<void> {
    return await new Promise(resolve => {
      this._server.close(() => {
        log('Certificate registration service closed')
        resolve()
      })
    })
  }
}
