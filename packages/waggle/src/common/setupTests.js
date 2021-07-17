import {
    setEngine,
    CryptoEngine
  } from 'pkijs'
  import { Crypto } from '@peculiar/webcrypto'
  import debug from 'debug'
  const log = Object.assign(debug('waggle:db'), {
    error: debug('waggle:db:err')
  })
  
//   const webcrypto = new Crypto()
  setEngine(
    'newEngine',
    webcrypto,
    new CryptoEngine({
      name: '',
      crypto: crypto,
      subtle: crypto.subtle
    })
  )

  jest.resetAllMocks()
