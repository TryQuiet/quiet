const native = require('./index.node')
const publicLiteNodes = [
  'https://lightwalletd.zecwallet.co:1443',
  'https://lightd-main.zecwallet.co:443',
  'https://lightd-main.zcashfr.io:443',
  'https://lightd-main.zecwallet.co:443'
]

class RPC {
  constructor () {
    for (const nodeUrl of publicLiteNodes) {
      const result = native.litelib_initialize_existing(nodeUrl)
      if (result.startsWith('Error: grpc-status')) {
        console.log(`Unable to connect to ${nodeUrl}`)
        continue
      }
      if (result.startsWith('Error: Cannot read wallet.')) {
        console.log(`Creating new wallet`)
        native.litelib_initialize_new(nodeUrl)
      }
      console.log(`Intialization: ${result}`)
      break
    }
  }
  sync = async () => {
    return native.litelib_execute('sync', '')
  }
  rescan = async () => {
    return native.litelib_execute('rescan', '')
  }
  seed = async () => {
    return JSON.parse(native.litelib_execute('seed', ''))
  }
  syncStatus = async () => {
    return JSON.parse(native.litelib_execute('syncstatus', ''))
  }
  info = async () => {
    return JSON.parse(native.litelib_execute('info', ''))
  }
  balance = async () => {
    return JSON.parse(native.litelib_execute('balance', ''))
  }
  notes = async () => {
    return JSON.parse(native.litelib_execute('notes', ''))
  }
  sendTransaction = async ({ address, amount = 0, memo = '' }) => {
    const result = await native.litelib_execute(
      'send',
      `${address},${amount},${memo}`
    )
    return JSON.parse(result)
  }
  sendTransaction = async (txns = []) => {
    // TODO add validation of payload
    const txnsArray = Array.isArray(txns) ? txns : [txns]
    const result = JSON.parse(
      await native.litelib_execute('send', JSON.stringify(txnsArray))
    )
    console.log(result)
    return result
  }
  list = async (includeMemoHex = 'yes') => {
    return JSON.parse(native.litelib_execute('list', `${includeMemoHex}`))
  }
  height = async () => {
    return JSON.parse(native.litelib_execute('height', '')).height
  }
  quit = async () => {
    return native.litelib_execute('quit', '')
  }
  save = async () => {
    return JSON.parse(native.litelib_execute('save', ''))
  }
  addresses = async () => {
    return JSON.parse(native.litelib_execute('addresses', ''))
  }
  getPrivKey = async address => {
    return JSON.parse(native.litelib_execute('export', address))[0].private_key
  }
  getViewingKey = async address => {
    return JSON.parse(native.litelib_execute('export', address))[0].viewing_key
  }
  getNewShieldedAdress = async () => {
    return JSON.parse(native.litelib_execute('new', 'z'))[0]
  }
  getNewTransparentAdress = async () => {
    return JSON.parse(native.litelib_execute('new', 't'))[0]
  }
  importKey = async ({ key, birthday, rescan }) => {
    return native.litelib_execute(
      'import',
      JSON.stringify({ key, birthday, norescan: rescan })
    )
  }
}
module.exports = RPC
