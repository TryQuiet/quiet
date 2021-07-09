import React, { FC, useEffect } from 'react';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import { Button } from '../Button/Button.component';
import { Input } from '../Input/Input.component';
import { Typography } from '../Typography/Typography.component';

import { RegistrationProps } from './Registration.types';

export const Registration: FC<RegistrationProps> = ({
  registerUsernameAction,
  registerUsernameError,
}) => {
  const [usernameInput, setUsernameInput] = useState<string | undefined>();
  const [inputError, setInputError] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (registerUsernameError) {
      setLoading(false);
      setInputError(registerUsernameError);
    }
  }, [registerUsernameError]);

  const onChangeText = (value: string) => {
    setInputError(undefined);
    setUsernameInput(value);
  };

  const onPress = () => {
    Keyboard.dismiss();
    setLoading(true);
    if (usernameInput === undefined || usernameInput?.length === 0) {
      setLoading(false);
      setInputError('Username can not be empty');
      return;
    }
    registerUsernameAction(usernameInput);
  };

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
        onChangeText={onChangeText}
        label={'Choose your favorite username'}
        placeholder={'Enter a username'}
        hint={
          'Your username cannot have any spaces or special characters, must be lowercase letters and numbers only.'
        }
        disabled={loading}
        validation={inputError}
      />
      <Button
        onPress={onPress}
        title={'Continue'}
        loading={loading}
        style={{ marginTop: 30 }}
      />
    </KeyboardAvoidingView>
  );
};
