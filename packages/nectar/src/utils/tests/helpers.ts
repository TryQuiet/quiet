import { createRootCA, RootCA } from '@zbayapp/identity/lib/generateRootCA';
import {
  createUserCsr,
  UserCsr,
} from '@zbayapp/identity/lib/requestCertificate';
import {
  createUserCert,
  UserCert,
} from '@zbayapp/identity/lib/generateUserCertificate';
import { config } from '../../sagas/users/const/certFieldTypes';
import { PeerId } from '../../sagas/identity/identity.slice';
import {
  keyFromCertificate,
  parseCertificate,
} from '@zbayapp/identity/lib/extractPubKey';
import { loadPrivateKey, sign } from '@zbayapp/identity/lib';
import { arrayBufferToString } from 'pvutils';
import { Time } from 'pkijs';

const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10));
const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10));

export const createRootCertificateTestHelper = async (): Promise<RootCA> => {
  return createRootCA(
    new Time({ type: 0, value: notBeforeDate }),
    new Time({ type: 0, value: notAfterDate })
  );
};

export const createUserCertificateTestHelper = async (
  user: {
    zbayNickname: string;
    commonName: string;
    peerId: string;
  },
  rootCA: Pick<RootCA, 'rootCertString' | 'rootKeyString'>
): Promise<{
  userCert: UserCert;
  userCsr: UserCsr;
}> => {
  const userCsr = await createUserCsr({
    zbayNickname: user.zbayNickname,
    commonName: user.commonName,
    peerId: user.peerId,
    dmPublicKey: '',
    signAlg: config.signAlg,
    hashAlg: config.hashAlg,
  });
  const userCert = await createUserCert(
    rootCA.rootCertString,
    rootCA.rootKeyString,
    userCsr.userCsr,
    notBeforeDate,
    notAfterDate
  );
  return {
    userCsr: userCsr,
    userCert: userCert,
  };
};

export const createPeerIdTestHelper = (): PeerId => {
  return {
    id: 'QmWVMaUqEB73gzgGkc9wS7rnhNcpSyH64dmbGUdU2TM3eV',
    privKey:
      'CAASqAkwggSkAgEAAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAECggEAOH8JeIfyecE4WXDr9wPSC232vwLt7nIFoCf+ZubfLskscTenGb37jH4jT3avvekx5Fd8xgVBNZzAeegpfKjFVCtepVQPs8HS4BofK9VHJX6pBWzObN/hVzHcV/Ikjj7xUPRgdti/kNBibcBR/k+1myAK3ybemgydQj1Mj6CQ7Tu/4npaRXhVygasbTgFCYxrV+CGjzITdCAdRTWg1+H6puxjfObZqj0wa4I6sCom0+Eau7nULtVmi0hodOwKwtmc2oaUyCQY2yiEjdZnkXEEhP1EtJka+kD96iAG3YvFqlcdUPYVlIxCP9h55AaOShnACNymiTpYzpCP/kUK9wFkZQKBgQD2wjjWEmg8DzkD3y19MVZ71w0kt0PgZMU+alR8EZCJGqvoyi2wcinfdmqyOZBf2rct+3IyVpwuWPjsHOHq7ZaJGmJkTGrNbndTQ+WgwJDvghqBfHFrgBQNXvqHl5EuqnRMCjrJeP8Uud1su5zJbHQGsycZwPzB3fSj0yAyRO812wKBgQCelDmknQFCkgwIFwqqdClUyeOhC03PY0RGngp+sLlu8Q8iyEI1E9i/jTkjPpioAZ/ub5iD6iP5gj27N239B/elZY5xQQeDA4Ns+4yNOTx+nYXmWcTfVINFVe5AK824TjqlCY2ES+/hVBKB+JQV6ILlcCj5dXz9cCbg6cys4TttBwKBgH+rdaSs2WlZpvIt4mdHw6tHVPGOMHxFJxhoA1Y98D4/onpLQOBt8ORBbGrSBbTSgLw1wJvy29PPDNt9BhZ63swI7qdeMlQft3VJR+GoQFTrR7N/I1+vYLCaV50X+nHel1VQZaIgDDo5ACtl1nUQu+dLggt9IklcAVtRvPLFX87JAoGBAIBl8+ZdWc/VAPjr7y7krzJ/5VdYF8B716R2AnliDkLN3DuFelYPo8g1SLZI0MH3zs74fL0Sr94unl0gHGZsNRAuko8Q4EwsZBWx97PBTEIYuXox5T4O59sUILzEuuUoMkO+4F7mPWxs7i9eXkj+4j1z+zlA79slG9WweJDiLYOxAoGBAMmH/nv1+0sUIL2qgE7OBs8kokUwx4P8ZRAlL6ZVC4tVuDBL0zbjJKcQWOcpWQs9pC6O/hgPur3VgHDF7gko3ZDB0KuxVJPZyIhoo+PqXaCeq4KuIPESjYKT803p2S76n/c2kUaQ5i2lYToClvhk72kw9o9niSyVdotXxC90abI9',
    pubKey:
      'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAE=',
  };
};

export const createMessageSignatureTestHelper = async (
  message: string,
  certificate: string,
  userKey: string
): Promise<{ signature: string; pubKey: string }> => {
  const pubKey = keyFromCertificate(parseCertificate(certificate));
  const keyObject = await loadPrivateKey(userKey, config.signAlg);
  const signatureArrayBuffer = await sign(message, keyObject);
  const signature = arrayBufferToString(signatureArrayBuffer);
  return {
    signature,
    pubKey,
  };
};

export default {
  createRootCertificateTestHelper,
  createUserCertificateTestHelper,
  createPeerIdTestHelper,
  createMessageSignatureTestHelper,
};
