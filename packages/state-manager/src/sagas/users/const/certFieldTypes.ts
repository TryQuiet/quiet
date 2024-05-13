export enum CertFieldsTypes {
  commonName = '2.5.4.3',
  subjectAltName = '2.5.29.17',
  nickName = '1.3.6.1.4.1.50715.2.1',
  peerId = '1.3.6.1.2.1.15.3.1.1',
}

export const config = {
  signAlg: 'ECDSA',
  hashAlg: 'sha-256',
}
