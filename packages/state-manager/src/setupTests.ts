import { setEngine, CryptoEngine } from 'pkijs'
import { Crypto } from '@peculiar/webcrypto'

import { io } from 'socket.io-client'

const webcrypto = new Crypto()
setEngine(
  'newEngine',
  webcrypto,
  new CryptoEngine({
    name: '',
    crypto: webcrypto,
    subtle: webcrypto.subtle,
  })
)

global.crypto = webcrypto
