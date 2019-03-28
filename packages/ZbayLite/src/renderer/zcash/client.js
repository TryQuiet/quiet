import JRPC from './jrpc'

import status from './status'

export default function Zcash (config) {
  this.request = new JRPC(config)
  this.status = status(this)
}
