const { Crypto } = require('@peculiar/webcrypto')

const crypto = new Crypto();
global.crypto = crypto;