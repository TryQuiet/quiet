const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { MARKER } = require('../../../backend/e2e/qss-only/mode.cjs')

function validateQssOnlyBundle(bundle, receiptPath = process.env.QUIET_QSS_ONLY_BUILD_RECEIPT) {
  if (!receiptPath || !path.isAbsolute(receiptPath)) throw new Error('Set QUIET_QSS_ONLY_BUILD_RECEIPT to the dedicated build receipt')
  const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'))
  const hash = createHash('sha256').update(bundle).digest('hex')
  if (receipt.version !== 1 || receipt.mode !== 'qss-only' || receipt.marker !== MARKER ||
      receipt.tor !== 'simulated-metadata' || receipt.p2p !== false || receipt.bundleSHA256 !== hash ||
      !bundle.includes(Buffer.from(MARKER)) ||
      JSON.stringify(receipt.replacedModules) !== JSON.stringify(['tor.module.cjs', 'tor.service.cjs', 'libp2p.js'])) {
    throw new Error('Packaged backend must match the QSS-only build receipt with Tor simulated and P2P disabled')
  }
  return { backendMode: 'qss-only', backendSHA256: hash, tor: 'simulated-metadata', p2p: false }
}

function validateDesktopQssOnlyBuild(binary, receiptPath) {
  const resources = process.platform === 'darwin' ? path.resolve(path.dirname(binary), '../Resources') : path.join(path.dirname(binary), 'resources')
  const asarPath = path.join(resources, 'app.asar')
  const asar = require(require.resolve('asar', { paths: [path.resolve(__dirname, '../../../desktop')] }))
  const bundle = asar.extractFile(asarPath, 'node_modules/backend-bundle/bundle.cjs')
  return validateQssOnlyBundle(bundle, receiptPath)
}

module.exports = { MARKER, validateQssOnlyBundle, validateDesktopQssOnlyBuild }
