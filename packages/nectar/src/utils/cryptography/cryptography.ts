import crypto from 'crypto';
import { constants } from './constants';

export const generateDmKeyPair = () => {
  const dh = crypto.createDiffieHellman(
    constants.prime,
    'hex',
    constants.generator,
    'hex'
  );
  dh.generateKeys();
  const dmPrivateKey = dh.getPrivateKey('hex');
  const dmPublicKey = dh.getPublicKey('hex');

  return { dmPublicKey, dmPrivateKey };
};
