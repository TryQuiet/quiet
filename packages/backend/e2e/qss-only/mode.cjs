const MARKER = 'QUIET_E2E_QSS_ONLY_BACKEND_V1'
const ENDPOINT = 'ws://localhost:3003'

// The local fixture listens on a loopback port of the session's choosing (QUIET_QSS_PORT in the
// harness, 3003 by default). The host name stays `localhost`, and staging is the only remote endpoint.
function isAllowedEndpoint(endpoint) {
  if (endpoint === 'wss://qss-dev.quiet-services.app') return true
  const port = /^ws:\/\/localhost:(\d{4,5})$/.exec(endpoint ?? '')?.[1]
  return port !== undefined && Number(port) >= 1024 && Number(port) <= 65535
}

function requireQssOnlyEnvironment(environment = process.env) {
  if (environment.IS_E2E !== 'true' || environment.QSS_ALLOWED !== 'true' || !isAllowedEndpoint(environment.QSS_ENDPOINT)) {
    throw new Error('The QSS-only E2E backend requires IS_E2E=true and the local fixture or staging QSS')
  }
}

// The bundle banner runs this check before any bundled code, so it inlines every function the check calls.
function startupGuardSource() {
  return `(function () { const ENDPOINT = ${JSON.stringify(ENDPOINT)}; ${isAllowedEndpoint.toString()} (${requireQssOnlyEnvironment.toString()})(process.env); })();`
}

module.exports = { MARKER, ENDPOINT, requireQssOnlyEnvironment, startupGuardSource }
