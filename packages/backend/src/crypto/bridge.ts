import { getCrypto, getEngine } from 'pkijs'
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
    try {
      const crypto = getCrypto()
      const value = await crypto[method](...args)
      this.cryptoService.sendResponse({ id, value })
    } catch (reason) {
      this.cryptoService.sendResponse({ id, reason })
    }
  }

  private attachCryptoServiceListeners = () => {
    this.cryptoService.on(SocketActionTypes.CRYPTO_SERVICE_CALL, async payload => {
      await this.onCall(payload)
    })
  }
}
