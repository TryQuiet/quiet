const { Crypto } = require('@peculiar/webcrypto')

console.log('Custom jest setup')
const crypto = new Crypto();
global.crypto = crypto;