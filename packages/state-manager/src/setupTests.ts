import * as dotenv from 'dotenv'
dotenv.config()

import { setEngine, CryptoEngine } from 'pkijs'
import { Crypto } from '@peculiar/webcrypto'

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
