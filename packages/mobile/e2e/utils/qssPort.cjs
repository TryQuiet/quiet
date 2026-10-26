// The loopback port of the local QSS fixture. Sessions that share a host each run their own
// fixture (`fixture.py up --port N`) and select it with QUIET_QSS_PORT; the default stays 3003.
const DEFAULT_QSS_PORT = 3003

function qssPort(environment = process.env) {
  const raw = environment.QUIET_QSS_PORT
  if (raw === undefined || raw === '') return DEFAULT_QSS_PORT
  const port = /^\d{4,5}$/.test(raw) ? Number(raw) : NaN
  if (!(port >= 1024 && port <= 65535)) throw new Error('QUIET_QSS_PORT must be an unprivileged port (1024-65535)')
  return port
}

// Keep `localhost`: QSS derives its LFA server identity from the advertised host name.
const qssEndpoint = (port = qssPort()) => `ws://localhost:${port}`

module.exports = { DEFAULT_QSS_PORT, qssPort, qssEndpoint }
