import { setEngine, CryptoEngine } from 'pkijs'

const crypto = require('crypto').webcrypto

setEngine(
  'newEngine',
  crypto,
  new CryptoEngine({
    name: '',
    crypto: crypto,
    subtle: crypto.subtle,
  })
)
