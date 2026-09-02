import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import http from 'node:http'

import { assertQssPayloadBinding } from './check-qss-qps-payload-binding.mjs'

let server
let baseUrl

before(async () => {
  server = http.createServer((request, response) => {
    response.setHeader('content-type', 'application/json')
    if (request.url === '/updated') {
      response.end(
        JSON.stringify({
          qps: {
            payloadBinding: 'ucan-v1',
            pushCredentialIsolation: 'lambda-v1',
          },
        })
      )
      return
    }
    if (request.url === '/direct-credentials') {
      response.end(
        JSON.stringify({
          qps: {
            payloadBinding: 'ucan-v1',
            pushCredentialIsolation: 'development-direct',
          },
        })
      )
      return
    }
    if (request.url === '/legacy') {
      response.end(JSON.stringify({}))
      return
    }

    response.statusCode = 503
    response.end(JSON.stringify({ status: 'down' }))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  await new Promise((resolve, reject) => {
    server.close(error => (error == null ? resolve() : reject(error)))
  })
})

test('accepts a QSS with UCAN-bound payload construction', async () => {
  await assert.doesNotReject(assertQssPayloadBinding(`${baseUrl}/updated`))
})

test('rejects a legacy QSS without the required capability', async () => {
  await assert.rejects(assertQssPayloadBinding(`${baseUrl}/legacy`), /does not advertise qps\.payloadBinding=ucan-v1/)
})

test('rejects a QSS that still holds the Firebase credentials', async () => {
  await assert.rejects(
    assertQssPayloadBinding(`${baseUrl}/direct-credentials`),
    /does not advertise qps\.pushCredentialIsolation=lambda-v1/
  )
})

test('rejects an unhealthy QSS', async () => {
  await assert.rejects(assertQssPayloadBinding(`${baseUrl}/down`), /503 Service Unavailable/)
})
