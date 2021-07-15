import { createSelector } from '@reduxjs/toolkit';
import { getCertFieldValue } from '@zbayapp/identity';
import { CertFieldsTypes } from './const/certFieldTypes';
import { StoreKeys } from '../store.keys';
import { selectReducer } from '../store.utils';
import { certificatesAdapter } from './users.adapter';
import { User } from './users.slice';

export const certificates = createSelector(
  selectReducer(StoreKeys.Users),
  reducerState => {
    return certificatesAdapter
      .getSelectors()
      .selectEntities(reducerState.certificates);
  },
);

export const certificatesMapping = createSelector(
  certificates,
  certificates => {
    let mapping: { [pubKey: string]: User } = {};
    Object.keys(certificates).map(pubKey => {
      const certificate = certificates[pubKey];

      if (!certificate || certificate.subject.typesAndValues.length < 3) {
        return;
      }

      return (mapping[pubKey] = {
        username: getCertFieldValue(certificate, CertFieldsTypes.nickName),
        onionAddress: getCertFieldValue(
          certificate,
          CertFieldsTypes.commonName,
        ),
        peerId: getCertFieldValue(certificate, CertFieldsTypes.peerId),
      });
    });
    return mapping;
  },
);
