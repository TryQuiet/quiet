jest.mock('node-fetch');
// import fetch from 'node-fetch';
const { Crypto } = require('@peculiar/webcrypto')

// const {Response} = jest.requireActual('node-fetch');

const crypto = new Crypto();
global.crypto = crypto;

