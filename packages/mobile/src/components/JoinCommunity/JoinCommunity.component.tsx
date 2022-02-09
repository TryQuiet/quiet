
import React, { FC, useEffect } from 'react'
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import { Button } from '../Button/Button.component';
import { Input } from '../Input/Input.component';
import { Typography } from '../Typography/Typography.component';

import { JoinCommunityProps } from './JoinCommunity.types'

export const JoinCommunity: FC<JoinCommunityProps> = ({
  joinCommunityAction,
  joinCommunityError,
}) => {
  const [joinCommunityInput, setJoinCommunityInput] = useState<string | undefined>();
  const [inputError, setInputError] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (joinCommunityError) {
      setLoading(false);
      setInputError(joinCommunityError);
    }
  }, [joinCommunityError]);

  const onChangeText = (value: string) => {
    setInputError(undefined);
    setJoinCommunityInput(value);
  };

  const onPress = () => {
    Keyboard.dismiss();
    setLoading(true);
    if (joinCommunityInput === undefined || joinCommunityInput?.length === 0) {
      setLoading(false);
      setInputError('Community address can not be empty');
      return;
    }
    joinCommunityAction(joinCommunityInput);
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
        {'Join community'}
      </Typography>
      <Input
        onChangeText={onChangeText}
        label={'Paste your invite link to join an existing community'}
        placeholder={'Invite link'}
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
}
