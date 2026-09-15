import { Agent as HttpAgent, type AgentCallbackCallback } from 'http'
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
    const target = overlay === 'lokinet' && this.lokinetAgent ? this.lokinetAgent : this.torAgent
    const fn = (target as any).addRequest
    if (typeof fn === 'function') {
      return fn.call(target, req, options)
    }
    return super.addRequest(req, options)
  }

  createConnection(options: any, callback?: AgentCallbackCallback) {
    const host: string = options?.host || options?.hostname || ''
    const overlay = overlayFromHost(host)
    const target = overlay === 'lokinet' && this.lokinetAgent ? this.lokinetAgent : this.torAgent
    const fn = (target as any).createConnection
    if (typeof fn === 'function') {
      return fn.call(target, options, callback)
    }
    return super.createConnection(options, callback)
  }
}
