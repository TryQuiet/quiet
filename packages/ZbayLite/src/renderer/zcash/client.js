import JRPC from './jrpc'

import status from './status'
import addresses from './addresses'
import accounting from './accounting'
import payment from './payment'
import keys from './keys'

export default function Zcash (config) {
  const RequestManager = config.requestManager || JRPC
  this.request = new RequestManager(config)
  this.status = status(this)
  this.addresses = addresses(this)
  this.accounting = accounting(this)
  this.payment = payment(this)
  this.keys = keys(this)
}
