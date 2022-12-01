import {
  CryptoServicePayload,
  CryptoServiceResponse,
  SocketActionTypes
} from '@quiet/state-manager'
import { Socket } from 'socket.io-client'
import { NodeEnv } from '../../../utils/const/NodeEnv.enum'
import uuid from 'react-native-uuid'

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
      rejectPromise: (reasone: any) => void
    }
  }

  private subtleCrypto?: SubtleCrypto

  constructor(socket: Socket) {
    this.socket = socket
  }

  public get subtle(): SubtleCrypto {
    if (this.subtleCrypto == null) {
      for (const m of SUBTLE_METHODS) {
        this.subtleCrypto[m] = async (...args) => {
          const call = await this.call(`subtle.${m}`, args)
          return call
        }
      }
    }
    return this.subtleCrypto
  }

  private call = async (method: string, args: any[]): Promise<any> => {
    const id = uuid.v4()
    // store this promise, so we can resolve it when we get a value
    // back from the crypto service
    let resolvePromise: (value: unknown) => void
    let rejectPromise: (reason?: any) => void
    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject
    })
    this.calls[id] = { resolvePromise, rejectPromise }
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
    const { id, value, reason } = payload
    const { resolvePromise, rejectPromise } = this.calls[id]
    if (!reason) {
      resolvePromise(value)
    } else {
      rejectPromise(reason)
    }
    delete this.calls[id]
  }
}
