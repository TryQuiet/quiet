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
  'getAlgorithmParameters',
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

  calls: Map<
    string,
    {
      resolve: (value: any) => void
      reject: (reason: any) => void
    }
  >

  constructor(socket: Socket) {
    this.socket = socket
    this.calls = new Map()
  }

  public get subtle(): SubtleCrypto {
    const subtle = {}
    for (const m of SUBTLE_METHODS) {
      subtle[m] = async (...args) => {
        return await this.call(`subtle.${m}`, args)
      }
    }
    return subtle as SubtleCrypto
  }

  public async call (method: string, args: any[]): Promise<any> {
    const id = uuid.v4().toString()
    // store this promise, so we can resolve it when we get a value
    // back from the crypto service
    const promise = new Promise((resolve, reject) => {
      this.calls.set(id, { resolve, reject })
    })
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

  public respond (payload: CryptoServiceResponse) {
    const { id, value, reason } = payload
    const call = this.calls.get(id)
    if (!call) {
      console.error(`No crypto call found for given id ${id}`)
      return
    }
    if (!reason) {
      call.resolve(value)
    } else {
      call.reject(reason)
    }
    delete this.calls[id]
  }
}
