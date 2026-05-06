import { setEngine, CryptoEngine } from 'pkijs'

setEngine(
  'newEngine',
  new CryptoEngine({
    name: 'newEngine',
    // @ts-ignore
    crypto: global.crypto,
  })
)
