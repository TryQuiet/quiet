import http from 'node:http'

export interface ToxiproxyProxy {
  name: string
  listen: string
  upstream: string
  enabled: boolean
}

export type ToxicType = 'latency' | 'bandwidth' | 'slow_close' | 'timeout' | 'slicer' | 'limit_data' | 'reset_peer'

export interface ToxicAttrs {
  latency?: number
  jitter?: number
  rate?: number
  bytes?: number
  delay?: number
  timeout?: number
  average_size?: number
  size_variation?: number
}

export interface Toxic {
  name: string
  type: ToxicType
  stream?: 'upstream' | 'downstream'
  toxicity?: number
  attributes?: ToxicAttrs
}

export class ToxiproxyClient {
  constructor(
    private readonly host: string = '127.0.0.1',
    private readonly port: number = 8474
  ) {}

  private request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const data = body == null ? undefined : JSON.stringify(body)
      const req = http.request(
        {
          host: this.host,
          port: this.port,
          method,
          path,
          headers:
            data != null
              ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
              : { 'Content-Type': 'application/json' },
        },
        res => {
          const chunks: Buffer[] = []
          res.on('data', (c: Buffer) => chunks.push(c))
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8')
            if (res.statusCode == null || res.statusCode >= 400) {
              reject(new Error(`toxiproxy ${method} ${path} -> ${res.statusCode}: ${text}`))
              return
            }
            try {
              resolve(text.length === 0 ? (undefined as unknown as T) : (JSON.parse(text) as T))
            } catch (e) {
              reject(e instanceof Error ? e : new Error(String(e)))
            }
          })
        }
      )
      req.on('error', reject)
      if (data != null) req.write(data)
      req.end()
    })
  }

  /** Create the proxy if absent; otherwise update its definition. */
  async ensureProxy(proxy: ToxiproxyProxy): Promise<ToxiproxyProxy> {
    try {
      return await this.request<ToxiproxyProxy>('POST', '/proxies', proxy)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      // 409 -> already exists; update it via /proxies/{name}
      if (!msg.includes('409') && !msg.toLowerCase().includes('already')) throw e
      return this.request<ToxiproxyProxy>('POST', `/proxies/${proxy.name}`, proxy)
    }
  }

  async listProxies(): Promise<Record<string, ToxiproxyProxy & { toxics: Toxic[] }>> {
    return this.request('GET', '/proxies')
  }

  async getProxy(name: string): Promise<ToxiproxyProxy & { toxics: Toxic[] }> {
    return this.request('GET', `/proxies/${name}`)
  }

  async setEnabled(proxyName: string, enabled: boolean): Promise<ToxiproxyProxy> {
    return this.request<ToxiproxyProxy>('POST', `/proxies/${proxyName}`, { enabled })
  }

  async addToxic(proxyName: string, toxic: Toxic): Promise<Toxic> {
    return this.request<Toxic>('POST', `/proxies/${proxyName}/toxics`, toxic)
  }

  async removeToxic(proxyName: string, toxicName: string): Promise<void> {
    await this.request<void>('DELETE', `/proxies/${proxyName}/toxics/${toxicName}`)
  }

  async clearToxics(proxyName: string): Promise<void> {
    const proxy = await this.getProxy(proxyName)
    for (const t of proxy.toxics ?? []) {
      try {
        await this.removeToxic(proxyName, t.name)
      } catch {
        // ignore — best-effort cleanup
      }
    }
  }

  /** Reset all proxies to a clean state. */
  async reset(): Promise<void> {
    await this.request<void>('POST', '/reset', {})
  }

  /** Remove a single proxy. Used by per-peer harnesses on shutdown. */
  async deleteProxy(name: string): Promise<void> {
    await this.request<void>('DELETE', `/proxies/${name}`)
  }

  /** Verify the admin API is reachable. Throws otherwise. */
  async ping(): Promise<void> {
    await this.request<unknown>('GET', '/version')
  }
}
