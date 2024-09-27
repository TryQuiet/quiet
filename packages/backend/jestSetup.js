import { setEngine, CryptoEngine } from 'pkijs'

const crypto = new Crypto()

setEngine(
  'newEngine',
  new CryptoEngine({
    name: 'newEngine',
    // @ts-ignore
    crypto: crypto,
  })
)
