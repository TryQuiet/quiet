import {
  CryptoServicePayload,
  CryptoServiceResponse,
  SocketActionTypes
} from '@quiet/state-manager'
import { Socket } from 'socket.io-client'
import { NodeEnv } from '../../../utils/const/NodeEnv.enum'

export interface ArrayBufferViewWithPromise extends ArrayBufferView {
  _promise?: Promise<ArrayBufferView>
}

const SUBTLE_METHODS = [
  'encrypt',
  'decrypt',
  'sign',
  'verify',
  'digest',
  'generateKey',
  'deriveKey',
  'deriveBits',
  'importKey',
  'exportKey',
  'wrapKey',
  'unwrapKey'
]

export class CryptoDelegator {
  socket: Socket

  calls: {
    [id: string]: {
      resolvePromise: (value: any) => void
    }
  }

  constructor(socket: Socket) {
    this.socket = socket
  }

  public get subtle(): SubtleCrypto {
    const subtle = {}
    for (const m of SUBTLE_METHODS) {
      subtle[m] = async (...args) => {
        const call = await this.call(`subtle.${m}`, args)
        return call
      }
    }
    return subtle as SubtleCrypto
  }

  private call = async (method: string, args: any[]): Promise<any> => {
    const id = CryptoDelegator.uuid()
    // store this promise, so we can resolve it when we get a value
    // back from the crypto service
    let resolvePromise
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    this.calls[id] = { resolvePromise }
    const payload: CryptoServicePayload = { id, method, args }
    if (!NodeEnv.Production) {
      console.log(
        '[CryptoDelegator] Sending message:',
        JSON.stringify({
          method,
          args
        })
      )
    }
    this.socket.emit(SocketActionTypes.CRYPTO_SERVICE_CALL, payload)
    return promise
  }

  public respond = (payload: CryptoServiceResponse) => {
    const { id, value } = payload
    this.calls[id].resolvePromise(value)
  }

  // http://stackoverflow.com/a/105074/907060
  private static uuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1)
    }
    return `${s4()}-${s4()}-${s4()}-${s4()}-${s4()}-${s4()}-${s4()}-${s4()}`
  }
}
