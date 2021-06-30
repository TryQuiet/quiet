import React, { FC } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { Button } from '../Button/Button.component';
import { Input } from '../Input/Input.component';
import { Typography } from '../Typography/Typography.component';

import { RegistrationProps } from './Registration.types';

export const Registration: FC<RegistrationProps> = ({
  registerUsernameAction,
}) => {
  return (
    <KeyboardAvoidingView
      behavior="height"
      style={{
        flex: 1,
        justifyContent: 'center',
        paddingLeft: 20,
        paddingRight: 20,
      }}>
      <Typography
        fontSize={24}
        fontWeight={'medium'}
        style={{ marginBottom: 30 }}>
        {'Register a username'}
      </Typography>
      <Input
        label={'Choose your favorite username'}
        placeholder={'Enter a username'}
        hint={
          'Your username cannot have any spaces or special characters, must be lowercase letters and numbers only.'
        }
      />
      <Button
        title={'Continue'}
        onPress={registerUsernameAction}
        style={{ marginTop: 30 }}
      />
    </KeyboardAvoidingView>
  );
};
