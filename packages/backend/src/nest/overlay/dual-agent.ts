import { Agent as HttpAgent } from 'http'
import type { HttpsProxyAgent } from 'https-proxy-agent'
import { overlayFromHost } from '@quiet/common'

/**
 * Routes CONNECT/HTTP through Tor's HTTP tunnel for .onion hosts and
 * through a Lokinet agent (or no proxy / TUN) for .loki hosts.
 */
export class DualOverlayAgent extends HttpAgent {
  constructor(
    private readonly torAgent: HttpsProxyAgent<string>,
    private readonly lokinetAgent?: HttpAgent
  ) {
    super({ keepAlive: true })
  }

  addRequest(req: any, options: any): void {
    const host: string = options?.host || options?.hostname || req?.host || ''
    const overlay = overlayFromHost(host)
    const target: any = overlay === 'lokinet' && this.lokinetAgent ? this.lokinetAgent : this.torAgent
    if (typeof target.addRequest === 'function') {
      target.addRequest(req, options)
      return
    }
    ;(HttpAgent.prototype as any).addRequest.call(this, req, options)
  }

  createConnection(options: any, callback?: (err: Error | null, socket?: any) => void) {
    const host: string = options?.host || options?.hostname || ''
    const overlay = overlayFromHost(host)
    const target: any = overlay === 'lokinet' && this.lokinetAgent ? this.lokinetAgent : this.torAgent
    if (typeof target.createConnection === 'function') {
      return target.createConnection(options, callback)
    }
    return (HttpAgent.prototype as any).createConnection.call(this, options, callback)
  }
}
