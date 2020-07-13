import native from '../../../native/index.node'
export default class RPC {
  constructor (url = 'https://lightwalletd.zecwallet.co:1443') {
    const result = native.litelib_initialize_existing(url)
    console.log(`Intialization: ${result}`)
  }
  sync = async () => {
    return native.litelib_execute('sync', '')
  }
  rescan = async () => {
    return native.litelib_execute('rescan', '')
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
  sendTransaction = async payload => {
    // TODO add validation of payload
    return native.litelib_execute('send', JSON.stringify(payload))
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
  getNewShieldedAdress = async () => {
    return JSON.parse(native.litelib_execute('new', 'z'))[0]
  }
  getNewTransparentAdress = async () => {
    return JSON.parse(native.litelib_execute('new', 't'))[0]
  }
}
