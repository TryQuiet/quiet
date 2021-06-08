import React, { FC } from 'react';
import { Error } from '../../components/Error/Error.component';
import { useDispatch } from 'react-redux';
import { assetsActions } from '../../store/assets/assets.slice';
import { ErrorScreenProps } from './Error.types';

export const ErrorScreen: FC<ErrorScreenProps> = ({ route }) => {
  const dispatch = useDispatch();
  return (
    <Error
      message={route.params.error}
      onPress={() => {
        dispatch(assetsActions.retryDownload());
      }}
    />
  );
};
