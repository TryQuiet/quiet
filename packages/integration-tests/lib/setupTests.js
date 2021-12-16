"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pkijs_1 = require("pkijs");
const pkijs_2 = require("pkijs");
const webcrypto_1 = require("@peculiar/webcrypto");
const webcrypto = new webcrypto_1.Crypto();
(0, pkijs_1.setEngine)('newEngine', webcrypto, new pkijs_2.CryptoEngine({
    name: '',
    crypto: webcrypto,
    subtle: webcrypto.subtle,
}));
global.crypto = webcrypto;
