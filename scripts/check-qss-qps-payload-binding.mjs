import { pathToFileURL } from 'node:url'

export const REQUIRED_QPS_PAYLOAD_BINDING = 'ucan-v1'
export const REQUIRED_QPS_PUSH_CREDENTIAL_ISOLATION = 'lambda-v1'
export const DEFAULT_PRODUCTION_CAPABILITIES_URL = 'https://qss-prod.quiet-services.app/health/capabilities'

export async function assertQssPayloadBinding(
  url = DEFAULT_PRODUCTION_CAPABILITIES_URL,
  { fetchImpl = fetch, timeoutMs = 10_000 } = {}
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`QSS capability request failed: ${response.status} ${response.statusText}`)
    }

    const capabilities = await response.json()
    const actual = capabilities?.qps?.payloadBinding
    if (actual !== REQUIRED_QPS_PAYLOAD_BINDING) {
      throw new Error(
        `Production QSS does not advertise qps.payloadBinding=${REQUIRED_QPS_PAYLOAD_BINDING}; got ${String(actual)}`
      )
    }

    const actualIsolation = capabilities?.qps?.pushCredentialIsolation
    if (actualIsolation !== REQUIRED_QPS_PUSH_CREDENTIAL_ISOLATION) {
      throw new Error(
        `Production QSS does not advertise qps.pushCredentialIsolation=${REQUIRED_QPS_PUSH_CREDENTIAL_ISOLATION}; got ${String(actualIsolation)}`
      )
    }

    return capabilities
  } finally {
    clearTimeout(timeout)
  }
}

async function main() {
  const url = process.argv[2] ?? process.env.QSS_CAPABILITIES_URL ?? DEFAULT_PRODUCTION_CAPABILITIES_URL
  await assertQssPayloadBinding(url)
  process.stdout.write(
    `QSS advertises ${REQUIRED_QPS_PAYLOAD_BINDING} payload binding and ${REQUIRED_QPS_PUSH_CREDENTIAL_ISOLATION} push credential isolation\n`
  )
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
