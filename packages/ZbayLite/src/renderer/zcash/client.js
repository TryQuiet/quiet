import JRPC from './jrpc'

import status from './status'
import addresses from './addresses'
import accounting from './accounting'

export default function Zcash (config) {
  this.request = new JRPC(config)
  this.status = status(this)
  this.addresses = addresses(this)
  this.accounting = accounting(this)
}
