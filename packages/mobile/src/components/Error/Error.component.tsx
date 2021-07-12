import React, { FC } from 'react';
import { Image, View } from 'react-native';
import { Button } from '../Button/Button.component';
import { Typography } from '../Typography/Typography.component';

import { ErrorProps } from './Error.types';

export const Error: FC<ErrorProps> = ({ onPress, icon, title, message }) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={icon}
        style={{
          margin: 20,
          resizeMode: 'cover',
          width: 84,
          height: 84,
        }}
      />
      <Typography fontSize={16} fontWeight={'medium'} color={'error'}>
        {title}
      </Typography>
      <Typography
        fontSize={14}
        horizontalTextAlign={'center'}
        style={{ margin: 10, maxWidth: 300 }}>
        {message}
      </Typography>
      <Button
        title={'Continue'}
        onPress={onPress}
        style={{ width: 100, marginTop: 10 }}
      />
    </View>
  );
};
