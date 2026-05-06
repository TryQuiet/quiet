import { setEngine, CryptoEngine } from 'pkijs'

setEngine(
  'newEngine',
  global.crypto,
  new CryptoEngine({
    name: '',
    crypto: global.crypto,
    subtle: global.crypto.subtle,
  })
)
