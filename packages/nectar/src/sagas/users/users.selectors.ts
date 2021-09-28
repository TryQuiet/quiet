import { createSelector } from '@reduxjs/toolkit';
import { getCertFieldValue } from '@zbayapp/identity';
import { CertFieldsTypes } from './const/certFieldTypes';
import { StoreKeys } from '../store.keys';
import { selectReducer } from '../store.utils';
import { certificatesAdapter } from './users.adapter';
import { User } from './users.slice';

export const certificates = createSelector(
  selectReducer(StoreKeys.Users),
  (reducerState) =>
    certificatesAdapter.getSelectors().selectEntities(reducerState.certificates)
);

export const certificatesMapping = createSelector(certificates, (certs) => {
  const mapping: { [pubKey: string]: User } = {};
  Object.keys(certs).map((pubKey) => {
    const certificate = certs[pubKey];

    if (!certificate || certificate.subject.typesAndValues.length < 3) {
      return;
    }

    return (mapping[pubKey] = {
      username: getCertFieldValue(certificate, CertFieldsTypes.nickName),
      onionAddress: getCertFieldValue(certificate, CertFieldsTypes.commonName),
      peerId: getCertFieldValue(certificate, CertFieldsTypes.peerId),
      dmPublicKey: getCertFieldValue(certificate, CertFieldsTypes.dmPublicKey),
    });
  });
  return mapping;
});

export const usersSelectors = {
  certificates,
  certificatesMapping,
};
