import express, { Request, Response } from 'express'
import { Tor } from '../torManager'
import { Certificate } from 'pkijs'
import debug from 'debug'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import { createUserCert, loadCSR } from '@zbayapp/identity'
import { CertFieldsTypes, getCertFieldValue } from '@zbayapp/identity/lib/common'
import { Server } from 'http'
import { validate, IsBase64, IsNotEmpty } from 'class-validator'
import { DataFromPems } from '../common/types'
import { CsrContainsFields, IsCsr } from './validators'
const log = Object.assign(debug('waggle:registration'), {
  error: debug('waggle:registration:err')
})

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
  private readonly _port: number
  private readonly _privKey: string
  private readonly tor: Tor
  private readonly _connectionsManager: ConnectionsManager
  private _onionAddress: string
  private readonly _dataFromPems: DataFromPems

  constructor(hiddenServicePrivKey: string, tor: Tor, connectionsManager: ConnectionsManager, dataFromPems: DataFromPems, port?: number) {
    this._app = express()
    this._privKey = hiddenServicePrivKey
    this._port = port || 7789
    this._connectionsManager = connectionsManager
    this.tor = tor
    this._onionAddress = null
    this._dataFromPems = dataFromPems
    this.setRouting()
  }

  private setRouting() {
    this._app.use(express.json())
    // eslint-disable-next-line
    this._app.post('/register', async (req, res): Promise<void> => await this.registerUser(req, res))
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
    const username = getCertFieldValue(parsedCsr, CertFieldsTypes.nickName)
    const usernameExists = this._connectionsManager.storage.usernameExists(username)
    if (usernameExists) {
      log(`Username ${username} is taken`)
      res.status(403).send()
      return
    }

    let cert: Certificate
    try {
      cert = await this.registerCertificate(userData.csr)
    } catch (e) {
      log.error(`Something went wrong with registering user: ${e.message as string}`)
      res.status(400).send()
      return
    }
    res.send(JSON.stringify(cert.userCertString))
  }

  private async registerCertificate(userCsr: string): Promise<Certificate> {
    const userCert = await createUserCert(this._dataFromPems.certificate, this._dataFromPems.privKey, userCsr, new Date(), new Date(2030, 1, 1))
    const certSaved = await this._connectionsManager.storage.saveCertificate(userCert.userCertString, this._dataFromPems)
    if (!certSaved) {
      throw new Error('Could not save certificate')
    }
    log('Saved certificate')
    return userCert
  }

  public async init() {
    this._onionAddress = await this.tor.spawnHiddenService({
      virtPort: this._port,
      targetPort: this._port,
      privKey: this._privKey
    })
  }

  public async listen(): Promise<void> {
    return await new Promise(resolve => {
      this._server = this._app.listen(this._port, () => {
        log(`Certificate registration service listening on ${this._onionAddress}.onion:${this._port}`)
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
