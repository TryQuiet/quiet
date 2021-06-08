import React, { FC } from 'react';
import { Image, View } from 'react-native';
import { appImages } from '../../../assets';
import { Button } from '../Button/Button.component';
import { Typography } from '../Typography/Typography.component';

import { ErrorProps } from './Error.types';

export const Error: FC<ErrorProps> = ({ onPress, message }) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={appImages.zbay_icon}
        style={{
          margin: 20,
          resizeMode: 'cover',
          width: 84,
          height: 84,
        }}
      />
      <Typography fontSize={16} fontWeight={'medium'} color={'error'}>
        {'Error'}
      </Typography>
      <Typography
        fontSize={14}
        horizontalTextAlign={'center'}
        style={{ margin: 10, maxWidth: 300 }}>
        {message}
      </Typography>
      <Button
        title={'Retry'}
        onPress={onPress}
        style={{ width: 100, marginTop: 10 }}
      />
    </View>
  );
};
