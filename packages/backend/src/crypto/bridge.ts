import crypto from 'crypto'
import { CryptoService } from './service'
import { CryptoServicePayload, SocketActionTypes } from '@quiet/state-manager'

export class CryptoBridge {
  cryptoService: CryptoService

  constructor(socketIOPort: number) {
    this.cryptoService = new CryptoService(socketIOPort)
    this.attachCryptoServiceListeners()
  }

  public onCall = async (payload: CryptoServicePayload) => {
    const { id, method, args } = payload
    const value = await crypto[method](args)
    this.cryptoService.sendResponse({ id, value })
  }

  private attachCryptoServiceListeners = () => {
    this.cryptoService.on(SocketActionTypes.CRYPTO_SERVICE_CALL, async payload => {
      await this.onCall(payload)
    })
  }
}
