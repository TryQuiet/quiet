import { setEngine, CryptoEngine } from'pkijs'
import { Crypto } from '@peculiar/webcrypto'

// jest.mock('node-fetch')
const crypto = new Crypto();
global.crypto = crypto;

setEngine('newEngine', new CryptoEngine({
    name: 'newEngine',
    // @ts-ignore
    crypto: crypto,
  }))
