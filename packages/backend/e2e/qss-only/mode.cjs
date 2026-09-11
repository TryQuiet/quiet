const MARKER = 'QUIET_E2E_QSS_ONLY_BACKEND_V1'
const ENDPOINT = 'ws://localhost:3003'

function requireQssOnlyEnvironment(environment = process.env) {
  if (environment.IS_E2E !== 'true' || environment.QSS_ALLOWED !== 'true' || environment.QSS_ENDPOINT !== ENDPOINT) {
    throw new Error('The QSS-only E2E backend requires IS_E2E=true and the local ws://localhost:3003 QSS fixture')
  }
}

module.exports = { MARKER, ENDPOINT, requireQssOnlyEnvironment }
