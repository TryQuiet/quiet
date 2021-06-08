import React, { FC } from 'react';
import { Image, View } from 'react-native';
import * as Progress from 'react-native-progress';
import { appImages } from '../../../assets';
import { defaultTheme } from '../../styles/themes/default.theme';
import { Typography } from '../Typography/Typography.component';

import { LoadingProps } from './Loading.types';

export const Loading: FC<LoadingProps> = ({ progress, description }) => {
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
      <Typography
        fontSize={14}
        horizontalTextAlign={'center'}
        style={{ margin: 10, maxWidth: 200 }}>
        {description}
      </Typography>
      {progress > 0 && progress < 0.95 && (
        <Progress.Bar
          progress={progress}
          color={defaultTheme.palette.main.brand}
        />
      )}
    </View>
  );
};
