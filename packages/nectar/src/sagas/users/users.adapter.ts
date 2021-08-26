import { createEntityAdapter } from '@reduxjs/toolkit';
import { keyFromCertificate } from '@zbayapp/identity/lib';
import Certificate from 'pkijs/src/Certificate';

export const certificatesAdapter = createEntityAdapter<Certificate>({
  selectId: keyFromCertificate,
});
