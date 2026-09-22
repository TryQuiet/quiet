const MARKER = 'QUIET_E2E_QSS_ONLY_BACKEND_V1'
const ENDPOINT = 'ws://localhost:3003'

function requireQssOnlyEnvironment(environment = process.env) {
  const endpoints = ['ws://localhost:3003', 'wss://qss-dev.quiet-services.app']
  if (environment.IS_E2E !== 'true' || environment.QSS_ALLOWED !== 'true' || !endpoints.includes(environment.QSS_ENDPOINT)) {
    throw new Error('The QSS-only E2E backend requires IS_E2E=true and the local fixture or staging QSS')
  }
}

module.exports = { MARKER, ENDPOINT, requireQssOnlyEnvironment }
