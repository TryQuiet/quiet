import { Certificates } from '@quiet/types'

class OnionAddress {
    private onionAddress: string|null = null
      get(): string {
        if (!this.onionAddress) {
          throw new Error('error')
        }
        return this.onionAddress
      }

      set(value: string) {
        this.onionAddress = value
      }
}

class TargetPort {
    private targetPort: string|null = null
      get(): string {
        if (!this.targetPort) {
          throw new Error('error')
        }
        return this.targetPort
      }

      set(value: string) {
        this.targetPort = value
      }
}

class Certs {
    private certs: Certificates |null = null
      get(): Certificates {
        if (!this.certs) {
          throw new Error('error')
        }
        return this.certs
      }

      set(value: Certificates) {
        this.certs = value
      }
}

class Peers {
    private peers: string|null = null
      get(): string {
        if (!this.peers) {
          throw new Error('error')
        }
        return this.peers
      }

      set(value: string) {
        this.peers = value
      }
}
export const onionAddress = new OnionAddress()
export const targetPort = new TargetPort()
export const certs = new Certs()
export const peers = new Peers()
