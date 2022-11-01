import { createUserCert, UserCert, loadCSR, CertFieldsTypes, getReqFieldValue, keyFromCertificate, parseCertificate } from '@quiet/identity'
import { SaveCertificatePayload, PermsData } from '@quiet/state-manager'
import { IsBase64, IsNotEmpty, validate } from 'class-validator'
import express, { Request, Response } from 'express'
import getPort from 'get-port'
import { Server } from 'http'
import { CertificationRequest } from 'pkijs'
import { getUsersAddresses } from '../common/utils'

import logger from '../logger'
import { Storage } from '../storage'
import { Tor } from '../torManager'
import { CsrContainsFields, IsCsr } from './validators'
import { registerOwner, registerUser, saveCertToDb } from './functions'
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

  private pendingPromise: Promise<{status: number, body: any}> = null

  private setRouting() {
    this._app.use(express.json())
    this._app.post(
      '/register',
      async (req, res): Promise<void> => {
        if (this.pendingPromise) return
        this.pendingPromise = this.registerUser(req.body.data)
        const result = await this.pendingPromise
        res.status(result.status).send(result.body)
        this.pendingPromise = null
      }
    )
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

  public getHiddenServiceData() {
      return {
        privateKey: this._privKey,
        onionAddress: this._onionAddress.split('.')[0]
      }
  }

  public async saveOwnerCertToDb(userCert: string): Promise<string> {
    await saveCertToDb(userCert, this._permsData, this._storage)
    return userCert
  }

  static async registerOwnerCertificate(userCsr: string, permsData: PermsData): Promise<string> {
    const cert = await registerOwner(userCsr, permsData)
    return cert
  }

  public async getPeers(): Promise<string[]> {
    const users = this._storage.getAllUsers()
    return await getUsersAddresses(users)
  }

  private async registerUser(csr: string): Promise<{status: number, body: any}> {
    const peerList = await this.getPeers()
    return await registerUser(csr, this._permsData, this._storage, peerList)
  }

  // Refactoring: This can be easily simplified if we generate 2 tor private keys for community owner as he creates community so privKey is always there.
  public async init(): Promise<void> {
    if (!this._port) {
      const port = await getPort({ port: 7789 })
      this._port = port
    }
    if (this._privKey) {
      this._onionAddress = await this.tor.spawnHiddenService(
      this._port,
      this._privKey,
      80
        )
    } else {
      let data = await this.tor.createNewHiddenService(this._port, 80)
      this._onionAddress = data.onionAddress
      this._privKey = data.privateKey
    }
  }
}
