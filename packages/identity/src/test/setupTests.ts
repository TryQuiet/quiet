import { setEngine, CryptoEngine } from 'pkijs'
import { Crypto } from '@peculiar/webcrypto'

const webcrypto = new Crypto()
const cryptoEngine = new CryptoEngine({
  name: '',
  crypto: webcrypto,
  subtle: webcrypto.subtle
}) as SubtleCrypto

setEngine('newEngine', webcrypto, cryptoEngine)

global.crypto = webcrypto
