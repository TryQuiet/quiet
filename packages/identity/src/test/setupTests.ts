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

// https://github.com/lobehub/lobehub/issues/5315#issuecomment-2572703223
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: true,
})
