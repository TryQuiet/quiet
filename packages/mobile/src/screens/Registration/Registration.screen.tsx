import React, { FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { appImages } from '../../../assets';
import { Registration } from '../../components/Registration/Registration.component';
import { ScreenNames } from '../../const/ScreenNames.enum';
import { initActions } from '../../store/init/init.slice';
import { replaceScreen } from '../../utils/functions/replaceScreen/replaceScreen';

import { errors, identity } from '@zbayapp/nectar';

export const RegistrationScreen: FC = () => {
  const dispatch = useDispatch();

  const currentIdentity = useSelector(identity.selectors.currentIdentity);

  const error = useSelector(errors.selectors.certificateRegistration);

  useEffect(() => {
    dispatch(initActions.setCurrentScreen(ScreenNames.RegistrationScreen));
  });

  useEffect(() => {
    if (
      currentIdentity !== undefined &&
      currentIdentity.userCertificate !== null
    ) {
      replaceScreen(ScreenNames.SuccessScreen, {
        onPress: () => {},
        icon: appImages.username_registered,
        title: 'You created a username',
        message: 'Your username will be registered shortly',
      });
    }
  }, [currentIdentity]);

  const registerUsername = (name: string) => {
    dispatch(identity.actions.registerUsername(name));
  };

  return (
    <Registration
      registerUsernameAction={registerUsername}
      registerUsernameError={error}
    />
  );
};
